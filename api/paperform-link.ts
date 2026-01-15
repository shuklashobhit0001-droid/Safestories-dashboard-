import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { booking_id } = req.query;

  if (!booking_id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  try {
    const result = await pool.query(
      'SELECT paperform_link FROM client_doc_form WHERE booking_id = $1',
      [booking_id]
    );

    if (result.rows.length > 0) {
      res.json({ paperform_link: result.rows[0].paperform_link });
    } else {
      res.json({ paperform_link: null });
    }
  } catch (error) {
    console.error('Error fetching paperform link:', error);
    res.status(500).json({ error: 'Failed to fetch paperform link' });
  }
}
