import { Request, Response } from 'express';
import pool from '../lib/db';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query(`
      SELECT COUNT(*) as live_count
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND booking_start_at <= NOW()
        AND booking_start_at + INTERVAL '50 minutes' >= NOW()
    `);

    res.json({ liveCount: parseInt(result.rows[0].live_count) || 0 });
  } catch (error) {
    console.error('Error fetching live sessions count:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions count' });
  }
}
