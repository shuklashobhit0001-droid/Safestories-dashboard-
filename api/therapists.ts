import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(`
      SELECT 
        t.therapist_id,
        t.name,
        t.specialization,
        t.contact_info,
        t.capacity,
        COUNT(b.booking_id) FILTER (WHERE b.booking_status != 'cancelled') as sessions_booked
      FROM therapists t
      LEFT JOIN bookings b ON t.therapist_id = b.booking_host_user_id
      GROUP BY t.therapist_id, t.name, t.specialization, t.contact_info, t.capacity
      ORDER BY t.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
}
