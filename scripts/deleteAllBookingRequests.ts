import pool from '../lib/db';

async function deleteAllBookingRequests() {
  try {
    const result = await pool.query('DELETE FROM booking_requests');
    console.log(`Deleted ${result.rowCount} rows from booking_requests`);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteAllBookingRequests();
