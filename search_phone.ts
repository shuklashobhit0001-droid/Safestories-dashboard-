import pool from './lib/db';

async function searchPhone() {
  try {
    const phone = '7057122366';

    console.log(`\n🔍 Searching: ${phone}\n`);

    // Check leads
    console.log('1️⃣  LEADS:');
    const leads = await pool.query(`
      SELECT id, name, email, phone, therapist_id, stage_booked_first_session_at
      FROM leads
      WHERE phone = $1 OR email LIKE $2
      LIMIT 10
    `, [phone, `%${phone}%`]);

    if (leads.rows.length > 0) {
      leads.rows.forEach(row => {
        console.log(`  Name: ${row.name}`);
        console.log(`  Email: ${row.email}`);
        console.log(`  Phone: ${row.phone}`);
        console.log(`  Therapist ID: ${row.therapist_id}`);
        console.log(`  Booked Session: ${row.stage_booked_first_session_at}`);
        console.log('---');
      });
    } else {
      console.log('  ❌ Not found');
    }

    // Check bookings
    console.log('\n2️⃣  BOOKINGS:');
    const bookings = await pool.query(`
      SELECT invitee_name, invitee_phone, invitee_email, booking_host_name, booking_status
      FROM bookings
      WHERE invitee_phone = $1
      LIMIT 10
    `, [phone]);

    if (bookings.rows.length > 0) {
      bookings.rows.forEach(row => {
        console.log(`  Name: ${row.invitee_name}`);
        console.log(`  Phone: ${row.invitee_phone}`);
        console.log(`  Email: ${row.invitee_email}`);
        console.log(`  Therapist: ${row.booking_host_name}`);
        console.log(`  Status: ${row.booking_status}`);
        console.log('---');
      });
    } else {
      console.log('  ❌ Not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

searchPhone();
