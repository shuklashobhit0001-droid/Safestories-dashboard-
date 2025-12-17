import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name as client_name,
        booking_resource_name as therapy_type,
        booking_mode as mode,
        booking_host_name as therapist_name,
        booking_start_at,
        booking_end_at
      FROM bookings
      WHERE booking_status != 'cancelled'
        AND booking_start_at >= CURRENT_DATE
      ORDER BY booking_start_at ASC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}
