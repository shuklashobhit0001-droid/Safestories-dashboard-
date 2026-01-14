import pool from '../lib/db.js';

async function deleteTestBooking() {
  try {
    await pool.query("DELETE FROM bookings WHERE booking_id = $1", [999999]);
    console.log('✓ Test booking deleted');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

deleteTestBooking();
