import pool from '../lib/db';

async function checkClientTimestamps() {
  try {
    console.log('Checking bookings table timestamps:');
    const bookings = await pool.query(`
      SELECT invitee_name, invitee_created_at 
      FROM bookings 
      ORDER BY invitee_created_at DESC NULLS LAST
      LIMIT 10;
    `);
    console.log(bookings.rows);

    console.log('\nChecking booking_requests table timestamps:');
    const requests = await pool.query(`
      SELECT client_name, created_at 
      FROM booking_requests 
      ORDER BY created_at DESC NULLS LAST
      LIMIT 10;
    `);
    console.log(requests.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkClientTimestamps();
