import pool from './lib/db';

async function searchAll() {
  try {
    console.log(`\n🔍 HITASHA - ALL SOURCES\n`);

    // Check bookings
    console.log('1️⃣  bookings:');
    const bookings = await pool.query(`
      SELECT DISTINCT invitee_name, invitee_phone, invitee_email, booking_host_name, booking_status
      FROM bookings
      WHERE LOWER(invitee_name) LIKE '%hitasha%'
    `);
    console.log(`Found: ${bookings.rows.length}`);
    if (bookings.rows.length > 0) {
      bookings.rows.forEach(row => {
        console.log(`  ${row.invitee_name} | ${row.invitee_phone} | ${row.invitee_email} | Therapist: ${row.booking_host_name}`);
      });
    }

    // Check all_clients_table
    console.log('\n2️⃣  all_clients_table:');
    const clients = await pool.query(`
      SELECT client_name, phone_number, email_id, assigned_therapist
      FROM all_clients_table
      WHERE LOWER(client_name) LIKE '%hitasha%'
    `);
    console.log(`Found: ${clients.rows.length}`);
    if (clients.rows.length > 0) {
      clients.rows.forEach(row => {
        console.log(`  ${row.client_name} | ${row.phone_number} | ${row.email_id} | ${row.assigned_therapist}`);
      });
    }

    if (bookings.rows.length === 0 && clients.rows.length === 0) {
      console.log('\n❌ HITASHA NOT FOUND ANYWHERE');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

searchAll();
