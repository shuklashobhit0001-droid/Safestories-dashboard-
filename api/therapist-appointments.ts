import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { therapist_id } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    // Get user info to find therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist user not found' });
    }

    const therapistUserId = userResult.rows[0].therapist_id;

    // Get appointments for this therapist from cache table
    const appointmentsResult = await pool.query(
      'SELECT * FROM therapist_appointments_cache WHERE therapist_id = $1 ORDER BY booking_date DESC',
      [therapistUserId]
    );

    res.json({
      appointments: appointmentsResult.rows
    });

  } catch (error) {
    console.error('Therapist appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist appointments' });
  }
}