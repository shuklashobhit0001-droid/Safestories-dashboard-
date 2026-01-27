import pool from '../lib/db';

async function checkSimoneBooking() {
  try {
    const result = await pool.query(`
      SELECT * FROM bookings 
      WHERE invitee_name ILIKE '%Simone%' 
      AND booking_start_at >= '2026-01-27 00:00:00'
      AND booking_start_at < '2026-01-28 00:00:00'
      ORDER BY booking_start_at DESC
    `);

    console.log('Total bookings found:', result.rows.length);
    console.log('\n=== RAW BOOKING DETAILS ===\n');
    
    result.rows.forEach((row, index) => {
      console.log(`\n--- Booking ${index + 1} ---`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSimoneBooking();
