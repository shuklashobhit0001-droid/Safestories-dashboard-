import pool from '../lib/db';

async function countBookings() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM bookings;');
    console.log(`Total bookings in database: ${result.rows[0].count}`);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countBookings();
