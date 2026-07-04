import pool from './lib/db';

async function checkClients() {
  try {
    const result = await pool.query(`
      SELECT
        booking_id,
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_mode,
        booking_status,
        booking_start_at,
        booking_duration
      FROM bookings
      WHERE
        invitee_phone LIKE '%9151713141%'
        OR invitee_phone LIKE '%9190499%'
        OR invitee_phone LIKE '%8879233236%'
        OR invitee_email IN ('bhagyashreekhairnar13@gmail.com', 'benazkias@gmail.com', 'anuani1962@gmail.com')
      ORDER BY invitee_name, booking_start_at DESC
    `);

    console.log('\n👥 Client Bookings Found:\n');
    result.rows.forEach((row: any) => {
      console.log(`Name: ${row.invitee_name}`);
      console.log(`Phone: ${row.invitee_phone}`);
      console.log(`Email: ${row.invitee_email}`);
      console.log(`Booking ID: ${row.booking_id}`);
      console.log(`Mode: ${row.booking_mode || 'N/A'}`);
      console.log(`Status: ${row.booking_status}`);
      console.log(`Start: ${row.booking_start_at}`);
      console.log(`Duration: ${row.booking_duration} min`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkClients();
