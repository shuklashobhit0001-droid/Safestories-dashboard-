import pool from '../lib/db';

// Simulate the API call
async function testTherapistStatsAPI() {
  try {
    const therapist_id = '3';
    
    console.log('Testing therapist-stats API logic...');
    console.log('Input therapist_id:', therapist_id);

    // Get user info to find therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    console.log('User lookup result:', userResult.rows);

    if (userResult.rows.length === 0) {
      console.log('❌ Therapist user not found');
      return;
    }

    const therapistUserId = userResult.rows[0].therapist_id;
    console.log('Therapist User ID:', therapistUserId);

    // Get stats from dedicated table
    const statsResult = await pool.query(
      'SELECT * FROM therapist_dashboard_stats WHERE therapist_id = $1',
      [therapistUserId]
    );

    console.log('Stats lookup result:', statsResult.rows);

    if (statsResult.rows.length === 0) {
      console.log('❌ Therapist stats not found');
      return;
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

    console.log('Upcoming bookings:', upcomingResult.rows);

    const response = {
      stats: {
        sessions: parseInt(stats.confirmed_sessions) || 0,
        noShows: parseInt(stats.no_shows) || 0,
        cancelled: parseInt(stats.cancelled_sessions) || 0
      },
      upcomingBookings: upcomingResult.rows
    };

    console.log('✅ API Response:', response);
    
    await pool.end();
  } catch (error) {
    console.error('❌ API Test Error:', error);
    process.exit(1);
  }
}

testTherapistStatsAPI();