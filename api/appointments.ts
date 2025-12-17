import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(`
      SELECT 
        booking_start_at,
        booking_resource_name,
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_mode
      FROM bookings
      ORDER BY booking_start_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}
