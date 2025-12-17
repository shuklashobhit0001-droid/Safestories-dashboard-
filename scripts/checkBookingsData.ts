import pool from '../lib/db';

async function checkBookingsData() {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM bookings;');
    console.log(`Total bookings in database: ${result.rows[0].total}`);
    
    if (result.rows[0].total > 0) {
      const sample = await pool.query('SELECT * FROM bookings LIMIT 5;');
      console.log('\nSample bookings:');
      console.log(JSON.stringify(sample.rows, null, 2));
    } else {
      console.log('\nNo bookings found in database. The table is empty.');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookingsData();
