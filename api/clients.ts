import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        COUNT(*) as session_count
      FROM bookings
      GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name
      ORDER BY invitee_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
}
