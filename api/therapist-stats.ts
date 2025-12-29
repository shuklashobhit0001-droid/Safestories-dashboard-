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

    // Get stats from dedicated table
    const statsResult = await pool.query(
      'SELECT * FROM therapist_dashboard_stats WHERE therapist_id = $1',
      [therapistUserId]
    );

    if (statsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist stats not found' });
    }

    const stats = statsResult.rows[0];

    // Get upcoming bookings from cache
    const upcomingResult = await pool.query(`
      SELECT *
      FROM therapist_appointments_cache 
      WHERE therapist_id = $1 
        AND booking_date > NOW()
        AND booking_status = 'confirmed'
      ORDER BY booking_date ASC
      LIMIT 10
    `, [therapistUserId]);

    // Get therapist info
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    const therapist = therapistResult.rows[0] || { name: 'Ishika Mahajan', specialization: 'Individual Therapy' };

    res.json({
      therapist: {
        name: therapist.name,
        specialization: therapist.specialization
      },
      stats: {
        sessions: parseInt(stats.confirmed_sessions) || 0,
        noShows: parseInt(stats.no_shows) || 0,
        cancelled: parseInt(stats.cancelled_sessions) || 0
      },
      upcomingBookings: upcomingResult.rows.map(booking => ({
        client_name: booking.client_name,
        therapy_type: booking.session_name,
        mode: booking.mode,
        session_timings: booking.session_timings
      }))
    });

  } catch (error) {
    console.error('Therapist stats error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist stats' });
  }
}