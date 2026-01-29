import pool from '../lib/db';

async function getAllBookingData() {
  try {
    const result = await pool.query(`
      SELECT * FROM bookings 
      WHERE invitee_name = 'Muskan' 
      AND booking_start_at::date = '2026-01-27'
    `);

    if (result.rows.length === 0) {
      console.log('No booking found');
      await pool.end();
      return;
    }

    const booking = result.rows[0];
    
    console.log('=== ALL BOOKING DATA FOR MUSKAN ===\n');
    
    Object.keys(booking).forEach(key => {
      console.log(`${key}: ${booking[key]}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getAllBookingData();
