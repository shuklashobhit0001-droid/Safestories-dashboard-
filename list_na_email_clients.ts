import pool from './lib/db';

async function listClientsWithNaEmail() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        invitee_name,
        invitee_phone,
        invitee_email,
        COUNT(DISTINCT booking_id) as booking_count
      FROM bookings
      WHERE invitee_email = 'na' OR invitee_email IS NULL OR invitee_email = ''
      GROUP BY invitee_name, invitee_phone, invitee_email
      ORDER BY invitee_name
    `);

    console.log(`\n📋 ALL CLIENTS WITH INVALID EMAIL (na/null/empty):\n`);
    console.log(`Total: ${result.rows.length} clients\n`);

    result.rows.forEach((row: any, idx: number) => {
      console.log(`${idx + 1}. ${row.invitee_name}`);
      console.log(`   Phone: ${row.invitee_phone}`);
      console.log(`   Email: ${row.invitee_email || 'NULL'}`);
      console.log(`   Bookings: ${row.booking_count}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listClientsWithNaEmail();
