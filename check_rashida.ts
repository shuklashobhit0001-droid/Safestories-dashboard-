import pool from './lib/db';

async function checkRashida() {
  try {
    const result = await pool.query(`
      SELECT
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name as therapist_name,
        booking_start_at
      FROM bookings
      WHERE invitee_phone LIKE '%9172765%' OR invitee_phone LIKE '%63554%'
      ORDER BY booking_start_at DESC
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('No client found with this phone number');
      process.exit(0);
    }

    console.log('\n👤 Client: Rashida\n');
    const therapists = new Set();
    result.rows.forEach((row: any) => {
      console.log(`Phone: ${row.invitee_phone}`);
      console.log(`Email: ${row.invitee_email}`);
      console.log(`Therapist: ${row.therapist_name}`);
      therapists.add(row.therapist_name);
      console.log('---');
    });

    console.log(`\n✅ Assigned Therapist(s): ${Array.from(therapists).join(', ')}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRashida();
