import pool from '../lib/db.js';

async function getAllData() {
  try {
    console.log('=== BOOKINGS TABLE ===\n');
    const bookings = await pool.query('SELECT * FROM bookings ORDER BY booking_start_at DESC');
    console.log(`Total bookings: ${bookings.rows.length}\n`);
    console.table(bookings.rows);

    console.log('\n=== BOOKING_REQUESTS TABLE ===\n');
    const bookingRequests = await pool.query('SELECT * FROM booking_requests ORDER BY created_at DESC');
    console.log(`Total booking requests: ${bookingRequests.rows.length}\n`);
    console.table(bookingRequests.rows);

    console.log('\n=== ALL_CLIENTS_TABLE ===\n');
    const allClients = await pool.query('SELECT * FROM all_clients_table ORDER BY client_name');
    console.log(`Total clients: ${allClients.rows.length}\n`);
    console.table(allClients.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

getAllData();
