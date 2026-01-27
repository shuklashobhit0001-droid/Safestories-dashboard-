import pool from '../lib/db';

async function checkThreeBookings() {
  try {
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_invitee_time,
        booking_start_at,
        booking_status
      FROM bookings 
      WHERE invitee_name IN ('Muskan', 'Samara Grewal', 'Simone Pinto')
      AND booking_start_at::date = '2026-01-27'
      ORDER BY booking_start_at
    `);

    console.log('=== BOOKING STATUS CHECK ===\n');
    
    result.rows.forEach(row => {
      console.log(`${row.invitee_name}:`);
      console.log(`  Booking ID: ${row.booking_id}`);
      console.log(`  Time: ${row.booking_invitee_time}`);
      console.log(`  Start: ${row.booking_start_at}`);
      console.log(`  Status: ${row.booking_status}`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkThreeBookings();
