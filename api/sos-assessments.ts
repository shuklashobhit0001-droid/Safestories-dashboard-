import { Request, Response } from 'express';
import pool from './lib/db.js';

export default async function handler(req: Request, res: Response) {
  if (req.method === 'POST') {
    try {
      const {
        booking_id,
        therapist_id,
        therapist_name,
        client_name,
        session_name,
        session_timings,
        contact_info,
        mode,
        risk_assessment
      } = req.body;

      // Validate required fields
      if (!risk_assessment || !risk_assessment.severity_level || !risk_assessment.risk_summary) {
        return res.status(400).json({ error: 'Missing required risk assessment data' });
      }

      const insertQuery = `
        INSERT INTO sos_risk_assessments (
          booking_id, therapist_id, therapist_name, client_name, session_name,
          session_timings, contact_info, mode,
          risk_severity_level, risk_severity_description,
          emotional_dysregulation, physical_harm_ideas, drug_alcohol_abuse,
          suicidal_attempt, self_harm, delusions_hallucinations, impulsiveness,
          severe_stress, social_isolation, concern_by_others, other_risk,
          other_details, risk_summary
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING id, created_at
      `;

      const values = [
        booking_id,
        therapist_id,
        therapist_name,
        client_name,
        session_name,
        session_timings,
        contact_info,
        mode,
        risk_assessment.severity_level,
        risk_assessment.severity_description,
        risk_assessment.risk_indicators?.emotionalDysregulation || null,
        risk_assessment.risk_indicators?.physicalHarmIdeas || null,
        risk_assessment.risk_indicators?.drugAlcoholAbuse || null,
        risk_assessment.risk_indicators?.suicidalAttempt || null,
        risk_assessment.risk_indicators?.selfHarm || null,
        risk_assessment.risk_indicators?.delusionsHallucinations || null,
        risk_assessment.risk_indicators?.impulsiveness || null,
        risk_assessment.risk_indicators?.severeStress || null,
        risk_assessment.risk_indicators?.socialIsolation || null,
        risk_assessment.risk_indicators?.concernByOthers || null,
        risk_assessment.risk_indicators?.other || null,
        risk_assessment.other_details || null,
        risk_assessment.risk_summary
      ];

      const result = await pool.query(insertQuery, values);
      const assessmentId = result.rows[0].id;
      const createdAt = result.rows[0].created_at;

      res.status(201).json({
        success: true,
        assessment_id: assessmentId,
        created_at: createdAt,
        message: 'SOS Risk Assessment saved successfully'
      });

    } catch (error) {
      console.error('❌ Error saving SOS Risk Assessment:', error);
      res.status(500).json({ 
        error: 'Failed to save SOS Risk Assessment',
        details: error.message 
      });
    }
  } 
  
  else if (req.method === 'GET') {
    try {
      const { therapist_id, status, limit = 50 } = req.query;
      
      let query = `
        SELECT * FROM sos_risk_assessments 
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 0;

      if (therapist_id) {
        paramCount++;
        query += ` AND therapist_id = $${paramCount}`;
        values.push(therapist_id);
      }

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        values.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
      values.push(limit);

      const result = await pool.query(query, values);

      res.status(200).json({
        success: true,
        assessments: result.rows,
        count: result.rows.length
      });

    } catch (error) {
      console.error('❌ Error fetching SOS Risk Assessments:', error);
      res.status(500).json({ 
        error: 'Failed to fetch SOS Risk Assessments',
        details: error.message 
      });
    }
  }
  
  else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const { webhook_sent, webhook_response, status, reviewed_by, resolution_notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Assessment ID is required' });
      }

      const updateQuery = `
        UPDATE sos_risk_assessments 
        SET 
          webhook_sent = COALESCE($2, webhook_sent),
          webhook_response = COALESCE($3, webhook_response),
          status = COALESCE($4, status),
          reviewed_by = COALESCE($5, reviewed_by),
          resolution_notes = COALESCE($6, resolution_notes),
          updated_at = CURRENT_TIMESTAMP,
          reviewed_at = CASE WHEN $5 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE reviewed_at END
        WHERE id = $1
        RETURNING *
      `;

      const values = [id, webhook_sent, webhook_response, status, reviewed_by, resolution_notes];
      const result = await pool.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'SOS Risk Assessment not found' });
      }

      res.status(200).json({
        success: true,
        assessment: result.rows[0],
        message: 'SOS Risk Assessment updated successfully'
      });

    } catch (error) {
      console.error('❌ Error updating SOS Risk Assessment:', error);
      res.status(500).json({ 
        error: 'Failed to update SOS Risk Assessment',
        details: error.message 
      });
    }
  }
  
  else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}