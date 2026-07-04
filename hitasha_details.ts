import pool from './lib/db';

async function hitashaDetails() {
  try {
    const result = await pool.query(`
      SELECT
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_status,
        booking_start_at,
        client_rating,
        COUNT(*) as total_bookings
      FROM bookings
      WHERE LOWER(invitee_name) LIKE '%hitasha%'
      GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name, booking_status, booking_start_at, client_rating
      ORDER BY booking_start_at DESC
    `);

    console.log(`\n👤 HITASHA - BOOKING DETAILS\n`);
    result.rows.forEach((row: any) => {
      console.log(`Name: ${row.invitee_name}`);
      console.log(`Phone: ${row.invitee_phone}`);
      console.log(`Email: ${row.invitee_email}`);
      console.log(`Therapist: ${row.booking_host_name}`);
      console.log(`Status: ${row.booking_status}`);
      console.log(`Latest: ${row.booking_start_at}`);
      console.log(`Total Bookings: ${row.total_bookings}`);
      console.log(`Rating: ${row.client_rating || 'None'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

hitashaDetails();
