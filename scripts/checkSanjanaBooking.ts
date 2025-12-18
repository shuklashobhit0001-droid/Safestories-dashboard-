import pool from '../lib/db';

async function checkBooking() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        booking_invitee_time,
        booking_start_at,
        booking_host_name
      FROM bookings
      WHERE booking_host_name LIKE '%Ishika%'
      ORDER BY booking_start_at DESC
      LIMIT 5
    `);
    
    console.log('Bookings with Ishika:');
    console.table(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBooking();
