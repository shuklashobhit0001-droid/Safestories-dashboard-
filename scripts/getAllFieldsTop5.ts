import pool from '../lib/db';

async function getAllFieldsTop5() {
  try {
    const result = await pool.query(`
      SELECT * FROM bookings
      ORDER BY booking_start_at DESC
      LIMIT 5;
    `);
    
    console.log('Top 5 Bookings - All Fields:');
    console.log('============================\n');
    result.rows.forEach((row, index) => {
      console.log(`BOOKING ${index + 1}:`);
      console.log(JSON.stringify(row, null, 2));
      console.log('\n' + '='.repeat(80) + '\n');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getAllFieldsTop5();
