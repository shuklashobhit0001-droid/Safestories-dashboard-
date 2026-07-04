import pool from './lib/db';

async function findAditia() {
  try {
    // Search by name, phone, or email
    const result = await pool.query(`
      SELECT DISTINCT
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name as therapist,
        booking_status,
        booking_start_at,
        client_rating,
        COUNT(*) as total_bookings
      FROM bookings
      WHERE LOWER(invitee_name) LIKE '%aditi%'
      OR invitee_phone = '7447537497'
      OR invitee_email IN ('aditiharidas97@gmail.com', 'aditim816@gmail.com')
      GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name, booking_status, booking_start_at, client_rating
      ORDER BY invitee_name, booking_start_at DESC
    `);

    console.log('\n👤 ADITI CLIENTS SEARCH:\n');
    console.log(`Found: ${result.rows.length} records\n`);

    result.rows.forEach((row: any, idx: number) => {
      console.log(`${idx + 1}. ${row.invitee_name}`);
      console.log(`   Phone: ${row.invitee_phone}`);
      console.log(`   Email: ${row.invitee_email}`);
      console.log(`   Therapist: ${row.therapist}`);
      console.log(`   Status: ${row.booking_status}`);
      console.log(`   Total Bookings: ${row.total_bookings}`);
      console.log(`   Latest Date: ${row.booking_start_at}`);
      console.log(`   Rating: ${row.client_rating ? `⭐ ${row.client_rating}/5` : 'None'}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findAditia();
