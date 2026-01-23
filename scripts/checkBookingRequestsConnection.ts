import pool from '../lib/db';

async function checkBookingRequestsConnection() {
  try {
    console.log('=== CHECKING booking_requests CONNECTION ===\n');

    // Check all columns in booking_requests
    console.log('1. booking_requests table structure:\n');
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_requests'
      ORDER BY ordinal_position;
    `);
    console.log(structure.rows);
    console.log('\n');

    // Check sample data
    console.log('2. Sample booking_requests data:\n');
    const sample = await pool.query(`SELECT * FROM booking_requests LIMIT 3;`);
    console.log(sample.rows);
    console.log('\n');

    // Try to match with bookings by client name
    console.log('3. Can we match booking_requests to bookings by client_name?\n');
    const match1 = await pool.query(`
      SELECT 
        br.client_name,
        br.client_email,
        br.therapist_name,
        COUNT(b.booking_id) as matching_bookings
      FROM booking_requests br
      LEFT JOIN bookings b ON b.invitee_name = br.client_name
      GROUP BY br.client_name, br.client_email, br.therapist_name
      LIMIT 5;
    `);
    console.log(match1.rows);
    console.log('\n');

    // Check if booking_requests has any ID that could link to bookings
    console.log('4. Does booking_requests have booking_link that contains booking_id?\n');
    const linkCheck = await pool.query(`
      SELECT booking_link 
      FROM booking_requests 
      WHERE booking_link IS NOT NULL 
      LIMIT 3;
    `);
    console.log(linkCheck.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkBookingRequestsConnection();
