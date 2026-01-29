import pool from '../lib/db';

async function checkAppointmentsCount() {
  try {
    console.log('=== CHECKING APPOINTMENTS COUNT ===\n');

    // Total bookings
    const total = await pool.query('SELECT COUNT(*) FROM bookings');
    console.log(`Total bookings in DB: ${total.rows[0].count}\n`);

    // What the API query returns
    const apiQuery = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.booking_start_at,
        b.booking_status
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      ORDER BY b.booking_start_at DESC
    `);

    console.log(`API query returns: ${apiQuery.rows.length} appointments\n`);

    // Show first 10
    console.log('First 10 appointments:');
    apiQuery.rows.slice(0, 10).forEach((row, i) => {
      console.log(`${i+1}. ${row.invitee_name} - ${row.booking_start_at} - ${row.booking_status}`);
    });

    // Check upcoming (future)
    const upcoming = await pool.query(`
      SELECT COUNT(*) FROM bookings
      WHERE booking_start_at > NOW()
      AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);
    console.log(`\nUpcoming (future): ${upcoming.rows[0].count}`);

    // Check past
    const past = await pool.query(`
      SELECT COUNT(*) FROM bookings
      WHERE booking_start_at <= NOW()
      AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);
    console.log(`Past: ${past.rows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAppointmentsCount();
