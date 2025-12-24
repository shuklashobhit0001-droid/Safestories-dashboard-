import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Therapist name is required' });
    }

    // Get unique clients for this therapist (grouped by email OR phone)
    const clientsResult = await pool.query(`
      WITH client_data AS (
        SELECT DISTINCT 
          invitee_name,
          invitee_email,
          invitee_phone
        FROM bookings
        WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
      )
      SELECT 
        invitee_name,
        invitee_email,
        STRING_AGG(DISTINCT invitee_phone, ', ') as invitee_phone
      FROM client_data
      GROUP BY invitee_name, invitee_email
      ORDER BY invitee_name
    `, [name]);

    // Get recent appointments for this therapist
    const appointmentsResult = await pool.query(`
      SELECT 
        invitee_name,
        booking_resource_name,
        booking_start_at,
        booking_invitee_time
      FROM bookings
      WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
      ORDER BY booking_start_at DESC
      LIMIT 10
    `, [name]);

    res.json({
      clients: clientsResult.rows,
      appointments: appointmentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching therapist details:', error);
    res.status(500).json({ error: 'Failed to fetch therapist details' });
  }
}
