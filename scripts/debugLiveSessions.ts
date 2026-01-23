import pool from '../lib/db';

async function debugLiveSessions() {
  try {
    console.log('Current time (NOW()):', new Date().toISOString());
    
    // Check what the query returns
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_host_name,
        booking_start_at,
        booking_start_at + INTERVAL '50 minutes' as booking_end_at,
        NOW() as current_time,
        booking_start_at <= NOW() as has_started,
        booking_start_at + INTERVAL '50 minutes' >= NOW() as not_ended,
        booking_status
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
      ORDER BY booking_start_at DESC
      LIMIT 5
    `);
    
    console.log('\nRecent bookings:');
    result.rows.forEach(row => {
      console.log(`\nBooking ${row.booking_id} - ${row.invitee_name}`);
      console.log(`  Therapist: ${row.booking_host_name}`);
      console.log(`  Start: ${row.booking_start_at}`);
      console.log(`  End: ${row.booking_end_at}`);
      console.log(`  Current: ${row.current_time}`);
      console.log(`  Has started: ${row.has_started}`);
      console.log(`  Not ended: ${row.not_ended}`);
      console.log(`  Status: ${row.booking_status}`);
      console.log(`  IS LIVE: ${row.has_started && row.not_ended}`);
    });
    
    const liveCount = await pool.query(`
      SELECT COUNT(*) as live_count
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND booking_start_at <= NOW()
        AND booking_start_at + INTERVAL '50 minutes' >= NOW()
    `);
    
    console.log('\n\nLive sessions count:', liveCount.rows[0].live_count);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugLiveSessions();
