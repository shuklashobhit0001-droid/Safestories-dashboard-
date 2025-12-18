import pool from '../lib/db';

async function checkSanjanaBooking() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        booking_start_at,
        booking_end_at,
        booking_invitee_time,
        NOW() as current_time,
        booking_end_at >= NOW() as is_upcoming
      FROM bookings 
      WHERE invitee_name ILIKE '%sanjana%'
      LIMIT 1
    `);
    
    console.log('\n=== Sanjana Booking Data ===');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSanjanaBooking();
