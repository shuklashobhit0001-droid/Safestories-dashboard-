import pool from '../lib/db';

async function debugLiveSessions() {
  try {
    console.log('=== DEBUGGING LIVE SESSIONS ===\n');
    
    // Check current time
    const timeResult = await pool.query('SELECT NOW() as current_time, NOW() AT TIME ZONE \'Asia/Kolkata\' as ist_time');
    console.log('Database Time:', timeResult.rows[0].current_time);
    console.log('IST Time:', timeResult.rows[0].ist_time);
    console.log('');
    
    // Check all bookings around current time
    const bookingsResult = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_host_name,
        booking_status,
        booking_start_at,
        booking_start_at + INTERVAL '50 minutes' as booking_end_at,
        NOW() as current_time,
        CASE 
          WHEN booking_start_at <= NOW() AND booking_start_at + INTERVAL '50 minutes' >= NOW() 
          THEN 'LIVE' 
          ELSE 'NOT LIVE' 
        END as is_live
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND booking_start_at >= NOW() - INTERVAL '2 hours'
        AND booking_start_at <= NOW() + INTERVAL '2 hours'
      ORDER BY booking_start_at DESC
    `);
    
    console.log(`Found ${bookingsResult.rows.length} bookings within 2 hours of now:\n`);
    
    bookingsResult.rows.forEach(booking => {
      console.log(`Booking ID: ${booking.booking_id}`);
      console.log(`Client: ${booking.invitee_name}`);
      console.log(`Therapist: ${booking.booking_host_name}`);
      console.log(`Status: ${booking.booking_status}`);
      console.log(`Start: ${booking.booking_start_at}`);
      console.log(`End: ${booking.booking_end_at}`);
      console.log(`Current: ${booking.current_time}`);
      console.log(`Is Live: ${booking.is_live}`);
      console.log('---');
    });
    
    // Check live count
    const liveResult = await pool.query(`
      SELECT COUNT(*) as live_count
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND booking_start_at <= NOW()
        AND booking_start_at + INTERVAL '50 minutes' >= NOW()
    `);
    
    console.log(`\nLive Sessions Count: ${liveResult.rows[0].live_count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugLiveSessions();
