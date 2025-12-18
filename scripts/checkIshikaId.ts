import pool from '../lib/db';

async function checkIshikaId() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT booking_host_user_id, booking_host_name 
      FROM bookings 
      WHERE booking_host_name ILIKE '%Ishika%'
    `);
    
    console.log('Ishika in bookings table:');
    console.log(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIshikaId();
