import pool from './lib/db';

async function checkAditi() {
  try {
    console.log('\n🔍 SEARCHING ALL TABLES FOR ADITI 7447537497\n');

    // Check all_clients_table
    console.log('1️⃣  all_clients_table:');
    const clients = await pool.query(`
      SELECT * FROM all_clients_table
      WHERE phone_number LIKE '%7447537497%'
      OR email_id LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${clients.rows.length}`);
    clients.rows.forEach(row => {
      console.log(`  - ${row.client_name} | ${row.phone_number} | ${row.email_id} | Therapist: ${row.assigned_therapist}`);
    });

    // Check session_progress_notes
    console.log('\n2️⃣  session_progress_notes:');
    const notes = await pool.query(`
      SELECT DISTINCT client_name, client_email, client_phone
      FROM session_progress_notes
      WHERE client_phone LIKE '%7447537497%'
      OR client_email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${notes.rows.length}`);
    notes.rows.forEach(row => {
      console.log(`  - ${row.client_name} | ${row.client_phone} | ${row.client_email}`);
    });

    // Check bookings with loose phone match
    console.log('\n3️⃣  bookings (loose match):');
    const bookings = await pool.query(`
      SELECT invitee_name, invitee_phone, invitee_email, booking_status
      FROM bookings
      WHERE invitee_phone LIKE '%7447537497%'
      OR invitee_email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${bookings.rows.length}`);
    bookings.rows.forEach(row => {
      console.log(`  - ${row.invitee_name} | ${row.invitee_phone} | ${row.invitee_email} | ${row.booking_status}`);
    });

    // Check users table (therapist/staff)
    console.log('\n4️⃣  users table:');
    const users = await pool.query(`
      SELECT id, name, email, phone_number FROM users
      WHERE phone_number LIKE '%7447537497%'
      OR email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${users.rows.length}`);
    users.rows.forEach(row => {
      console.log(`  - ${row.name} | ${row.phone_number} | ${row.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAditi();
