import pool from '../lib/db';

async function checkTherapyTypes() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT booking_resource_name
      FROM bookings
      WHERE booking_resource_name IS NOT NULL
      ORDER BY booking_resource_name
    `);
    
    console.log('\nTherapy types in database:');
    if (result.rows.length === 0) {
      console.log('No therapy types found');
    } else {
      result.rows.forEach(row => {
        console.log(`- ${row.booking_resource_name}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTherapyTypes();
