import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { start, end } = req.query;
    const dateFilter = start && end ? `AND booking_start_at BETWEEN '${start}' AND '${end} 23:59:59'` : '';

    const revenue = await pool.query(`
      SELECT COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status != 'cancelled' ${dateFilter}
    `);

    const sessions = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status IN ('confirmed', 'rescheduled') ${dateFilter}
    `);

    const freeConsultations = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) ${dateFilter}
    `);

    const cancelled = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'cancelled' ${dateFilter}
    `);

    const refunds = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE refund_status IN ('completed', 'processed') ${dateFilter}
    `);

    const noShows = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'no_show' ${dateFilter}
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
