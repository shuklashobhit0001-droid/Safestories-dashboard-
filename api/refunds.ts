import pool from '../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        r.client_name,
        r.session_name,
        r.session_timings,
        b.refund_status,
        b.invitee_phone,
        b.invitee_email,
        b.refund_amount
      FROM refund_cancellation_table r
      LEFT JOIN bookings b ON r.session_id = b.booking_id
      WHERE b.refund_status IS NOT NULL
    `;

    if (status && status !== 'all') {
      query += ` AND b.refund_status = $1`;
      const result = await pool.query(query + ' ORDER BY r.session_timings DESC', [status]);
      return res.status(200).json(result.rows);
    }

    const result = await pool.query(query + ' ORDER BY r.session_timings DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
