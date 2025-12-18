import pool from '../lib/db';

async function checkMode() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT booking_mode, COUNT(*) as count
      FROM bookings
      GROUP BY booking_mode
      ORDER BY count DESC
    `);
    
    console.log('Booking modes in database:');
    console.table(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMode();
