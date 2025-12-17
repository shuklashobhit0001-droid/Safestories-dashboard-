import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const revenue = await pool.query(`
      SELECT COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status != 'cancelled'
    `);

    const sessions = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status IN ('confirmed', 'rescheduled')
    `);

    const freeConsultations = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE invitee_payment_amount = 0 OR invitee_payment_amount IS NULL
    `);

    const cancelled = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'cancelled'
    `);

    const refunds = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE refund_status IN ('completed', 'processed')
    `);

    const noShows = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'no_show'
    `);

    res.json({
      revenue: revenue.rows[0].total,
      sessions: sessions.rows[0].total,
      freeConsultations: freeConsultations.rows[0].total,
      cancelled: cancelled.rows[0].total,
      refunds: refunds.rows[0].total,
      noShows: noShows.rows[0].total,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
