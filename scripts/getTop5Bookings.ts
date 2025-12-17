import pool from '../lib/db';

async function getTop5Bookings() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        booking_resource_name,
        booking_mode,
        booking_host_name,
        booking_start_at
      FROM bookings
      ORDER BY booking_start_at DESC
      LIMIT 5;
    `);
    
    console.log('Top 5 Bookings:');
    console.log('===============\n');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}.`);
      console.log(`   Client Name: ${row.invitee_name}`);
      console.log(`   Therapy Type: ${row.booking_resource_name}`);
      console.log(`   Mode: ${row.booking_mode}`);
      console.log(`   Assigned Therapist: ${row.booking_host_name}`);
      console.log(`   Session Timings: ${row.booking_start_at}\n`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getTop5Bookings();
