import pool from './lib/db';

async function searchSayali() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name as therapist,
        booking_status,
        booking_start_at,
        client_rating
      FROM bookings
      WHERE LOWER(invitee_name) LIKE '%sayali%'
      OR LOWER(invitee_name) LIKE '%sanjay%'
      ORDER BY invitee_name, booking_start_at DESC
    `);

    console.log('\n👤 SAYALI DATA:\n');
    console.log(`Found: ${result.rows.length} bookings\n`);

    result.rows.forEach((row: any, idx: number) => {
      console.log(`${idx + 1}. ${row.invitee_name}`);
      console.log(`   Phone: ${row.invitee_phone}`);
      console.log(`   Email: ${row.invitee_email}`);
      console.log(`   Therapist: ${row.therapist}`);
      console.log(`   Status: ${row.booking_status}`);
      console.log(`   Date: ${row.booking_start_at}`);
      console.log(`   Rating: ${row.client_rating ? `⭐ ${row.client_rating}/5` : 'N/A'}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

searchSayali();
