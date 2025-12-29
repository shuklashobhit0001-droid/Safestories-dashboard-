import pool from '../lib/db';

async function testTherapistStats() {
  try {
    // Test the same logic as the API
    const therapist_id = 3; // Ishika's user ID
    
    // Get user info to find therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    console.log('User result:', userResult.rows);

    if (userResult.rows.length === 0) {
      console.log('Therapist user not found');
      return;
    }

    const therapistUserId = userResult.rows[0].therapist_id;
    console.log('Therapist User ID:', therapistUserId);

    // Get therapist info from therapists table
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    console.log('Therapist info:', therapistResult.rows[0]);

    // Get stats for this therapist
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed_sessions,
        COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled_sessions,
        COUNT(CASE WHEN booking_status = 'no_show' THEN 1 END) as no_shows
      FROM bookings 
      WHERE booking_host_user_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [therapistUserId]);
    console.log('Stats:', statsResult.rows[0]);

    // Get upcoming bookings for this therapist
    const upcomingQuery = `
      SELECT 
        invitee_name as client_name,
        booking_resource_name as therapy_type,
        booking_mode as mode,
        booking_invitee_time as session_timings,
        booking_start_at,
        booking_status
      FROM bookings 
      WHERE booking_host_user_id = $1 
        AND booking_start_at > NOW()
        AND booking_status = 'confirmed'
      ORDER BY booking_start_at ASC
      LIMIT 10
    `;

    const upcomingResult = await pool.query(upcomingQuery, [therapistUserId]);
    console.log('Upcoming bookings:', upcomingResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testTherapistStats();