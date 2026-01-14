import pool from '../lib/db.js';

async function checkIshikaUser() {
  try {
    // Check all therapist users
    const usersResult = await pool.query(
      "SELECT id, username, therapist_id, role FROM users WHERE role = 'therapist'"
    );

    console.log('Therapist users:');
    console.log(usersResult.rows);

    // Check Ishika's bookings
    const bookingsResult = await pool.query(
      "SELECT booking_id, invitee_name, booking_resource_name, booking_host_name FROM bookings WHERE booking_host_name ILIKE '%Ishika%' LIMIT 5"
    );

    console.log('\nIshika bookings:');
    console.log(bookingsResult.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIshikaUser();
