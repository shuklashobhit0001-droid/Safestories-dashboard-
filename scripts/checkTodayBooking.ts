import pool from '../lib/db';

async function checkTodayBooking() {
  try {
    const now = new Date();
    console.log('Current time:', now.toISOString());
    console.log('Current IST:', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    // Check the booking for Nishita Chang
    const booking = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_start_at,
        booking_invitee_time,
        booking_status,
        booking_start_at >= NOW() as is_future
      FROM bookings 
      WHERE invitee_name ILIKE '%Nishita%'
      ORDER BY booking_start_at DESC
      LIMIT 1
    `);
    
    console.log('\nBooking details:');
    console.log(booking.rows[0]);
    
    // Check what upcoming bookings query returns
    const upcoming = await pool.query(`
      SELECT 
        invitee_name,
        booking_start_at,
        booking_status
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
        AND booking_start_at >= NOW()
      ORDER BY booking_start_at ASC
      LIMIT 5
    `);
    
    console.log('\nUpcoming bookings (first 5):');
    upcoming.rows.forEach(row => {
      console.log(`${row.invitee_name}: ${row.booking_start_at} (${row.booking_status})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTodayBooking();
