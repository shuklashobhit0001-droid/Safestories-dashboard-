import pool from './lib/db';

async function checkAditi() {
  try {
    console.log('\n🔍 SEARCHING FOR ADITI 7447537497\n');

    // Check all_clients_table
    console.log('1️⃣  all_clients_table:');
    const clients = await pool.query(`
      SELECT * FROM all_clients_table
      WHERE phone_number LIKE '%7447537497%'
      OR email_id LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${clients.rows.length}`);
    if (clients.rows.length > 0) {
      clients.rows.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    }

    // Check bookings
    console.log('\n2️⃣  bookings table:');
    const bookings = await pool.query(`
      SELECT invitee_name, invitee_phone, invitee_email, booking_status
      FROM bookings
      WHERE invitee_phone LIKE '%7447537497%'
      OR invitee_email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${bookings.rows.length}`);
    if (bookings.rows.length > 0) {
      bookings.rows.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    }

    // Check if exists in CRM (checking available tables)
    console.log('\n3️⃣  List all tables:');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('Tables:', tables.rows.map((r: any) => r.table_name).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAditi();
