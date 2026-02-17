import { Request, Response } from 'express';
import pool from './lib/db.js';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'GET') {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // 1. Validate token
      const tokenQuery = `
        SELECT 
          sat.*,
          sra.risk_severity_level,
          sra.risk_severity_description,
          sra.risk_summary,
          sra.created_at as sos_created_at
        FROM sos_access_tokens sat
        LEFT JOIN sos_risk_assessments sra ON sat.sos_assessment_id = sra.id
        WHERE sat.token = $1
      `;
      
      const tokenResult = await pool.query(tokenQuery, [token]);

      if (tokenResult.rows.length === 0) {
        return res.status(404).json({ error: 'Invalid or expired token' });
      }

      const tokenData = tokenResult.rows[0];

      // Check if token is active
      if (!tokenData.is_active) {
        return res.status(403).json({ error: 'This link has been revoked' });
      }

      // Check if token is expired
      if (new Date(tokenData.expires_at) < new Date()) {
        return res.status(403).json({ error: 'This link has expired' });
      }

      // 2. Fetch client documentation
      const clientEmail = tokenData.client_email;
      const clientPhone = tokenData.client_phone;
      const clientName = tokenData.client_name;

      // Get client_id from bookings table
      const clientIdQuery = `
        SELECT DISTINCT invitee_email || '_' || invitee_phone as client_id
        FROM bookings
        WHERE invitee_email = $1 AND invitee_phone = $2
        LIMIT 1
      `;
      const clientIdResult = await pool.query(clientIdQuery, [clientEmail, clientPhone]);
      const clientId = clientIdResult.rows[0]?.client_id || `${clientEmail}_${clientPhone}`;

      // Get case history
      const caseHistoryQuery = `
        SELECT * FROM client_case_history
        WHERE client_name = $1 OR client_id = $2
        ORDER BY created_at DESC
      `;
      const caseHistory = await pool.query(caseHistoryQuery, [clientName, clientId]);

      // Get all progress notes
      const progressNotesQuery = `
        SELECT * FROM client_progress_notes
        WHERE client_name = $1 OR client_id = $2
        ORDER BY session_date DESC
      `;
      const progressNotes = await pool.query(progressNotesQuery, [clientName, clientId]);

      // Get therapy goals
      const goalsQuery = `
        SELECT * FROM client_therapy_goals
        WHERE client_name = $1 OR client_id = $2
        ORDER BY created_at DESC
      `;
      const goals = await pool.query(goalsQuery, [clientName, clientId]);

      // Get session count
      const sessionCountQuery = `
        SELECT COUNT(*) as session_count
        FROM bookings
        WHERE invitee_email = $1 AND invitee_phone = $2
        AND booking_status != 'cancelled'
      `;
      const sessionCount = await pool.query(sessionCountQuery, [clientEmail, clientPhone]);

      // Get emergency contact from bookings
      const emergencyContactQuery = `
        SELECT invitee_question
        FROM bookings
        WHERE invitee_email = $1 AND invitee_phone = $2
        AND invitee_question IS NOT NULL
        ORDER BY booking_start_at DESC
        LIMIT 1
      `;
      const emergencyContact = await pool.query(emergencyContactQuery, [clientEmail, clientPhone]);

      // 3. Update access tracking
      const updateAccessQuery = `
        UPDATE sos_access_tokens
        SET 
          accessed_at = CASE WHEN accessed_at IS NULL THEN CURRENT_TIMESTAMP ELSE accessed_at END,
          access_count = access_count + 1
        WHERE token = $1
      `;
      await pool.query(updateAccessQuery, [token]);

      // 4. Return all documentation
      res.status(200).json({
        success: true,
        client: {
          name: tokenData.client_name,
          email: clientEmail,
          phone: clientPhone,
          session_count: sessionCount.rows[0]?.session_count || 0,
          emergency_contact: emergencyContact.rows[0]?.invitee_question || null
        },
        sos_assessment: {
          severity_level: tokenData.risk_severity_level,
          severity_description: tokenData.risk_severity_description,
          risk_summary: tokenData.risk_summary,
          created_at: tokenData.sos_created_at
        },
        documentation: {
          case_history: caseHistory.rows,
          progress_notes: progressNotes.rows,
          therapy_goals: goals.rows
        },
        token_info: {
          created_at: tokenData.created_at,
          expires_at: tokenData.expires_at,
          access_count: tokenData.access_count + 1
        }
      });

    } catch (error) {
      console.error('❌ Error fetching SOS documentation:', error);
      res.status(500).json({ 
        error: 'Failed to fetch documentation',
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
