import pool from '../lib/db';

async function findSanjanaBooking() {
  try {
    const result = await pool.query(`
      SELECT * FROM bookings
      WHERE invitee_name ILIKE '%Sanjana%'
      AND booking_resource_name ILIKE '%Ishika Mahajan%'
      AND booking_host_name ILIKE '%Ishika%';
    `);
    
    console.log(`Found ${result.rows.length} matching booking(s):\n`);
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

findSanjanaBooking();
