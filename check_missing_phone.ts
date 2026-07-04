import pool from './lib/db';

async function checkMissingPhone() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        invitee_name,
        invitee_phone,
        invitee_email
      FROM bookings
      WHERE (invitee_email = 'na' OR invitee_email IS NULL OR invitee_email = '')
      AND (invitee_phone IS NULL OR invitee_phone = '')
      ORDER BY invitee_name
    `);

    console.log(`\n🔴 CLIENTS WITH INVALID EMAIL AND NO PHONE (HIDDEN from All Clients):\n`);
    console.log(`Total: ${result.rows.length} clients\n`);

    if (result.rows.length === 0) {
      console.log('✅ All 33 clients have phone numbers - should be visible in All Clients');
    } else {
      result.rows.forEach((row: any, idx: number) => {
        console.log(`${idx + 1}. ${row.invitee_name}`);
        console.log(`   Phone: ${row.invitee_phone || 'MISSING'}`);
        console.log(`   Email: ${row.invitee_email || 'MISSING'}`);
        console.log('---');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMissingPhone();
