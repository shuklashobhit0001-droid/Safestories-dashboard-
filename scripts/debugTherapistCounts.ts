import pool from '../lib/db';

async function debugTherapistCounts() {
  try {
    console.log('Checking therapist names in therapists table:');
    const therapists = await pool.query('SELECT name FROM therapists LIMIT 5');
    console.log(therapists.rows);

    console.log('\n\nChecking booking_host_name in bookings table:');
    const bookings = await pool.query('SELECT DISTINCT booking_host_name FROM bookings');
    console.log(bookings.rows);

    console.log('\n\nTrying the join query:');
    const result = await pool.query(`
      SELECT 
        t.name,
        b.booking_host_name,
        COUNT(b.booking_id) as total_sessions
      FROM therapists t
      LEFT JOIN bookings b ON t.name = b.booking_host_name
      GROUP BY t.name, b.booking_host_name
      LIMIT 5
    `);
    console.log(JSON.stringify(result.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugTherapistCounts();
