import pool from '../lib/db';

async function debugTherapistBookings() {
  try {
    console.log('\n1. Checking therapists table:');
    const therapists = await pool.query('SELECT therapist_id, name FROM therapists LIMIT 5');
    console.log(therapists.rows);

    console.log('\n2. Checking bookings table - booking_host_user_id values:');
    const bookings = await pool.query('SELECT DISTINCT booking_host_user_id, booking_host_name FROM bookings LIMIT 10');
    console.log(bookings.rows);

    console.log('\n3. Checking if booking_host_user_id matches any therapist_id:');
    const match = await pool.query(`
      SELECT 
        t.therapist_id,
        t.name as therapist_name,
        b.booking_host_user_id,
        b.booking_host_name,
        COUNT(*) as count
      FROM therapists t
      LEFT JOIN bookings b ON t.therapist_id = b.booking_host_user_id
      GROUP BY t.therapist_id, t.name, b.booking_host_user_id, b.booking_host_name
      LIMIT 10
    `);
    console.log(match.rows);

    console.log('\n4. Total bookings count:');
    const total = await pool.query('SELECT COUNT(*) FROM bookings');
    console.log('Total bookings:', total.rows[0].count);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugTherapistBookings();
