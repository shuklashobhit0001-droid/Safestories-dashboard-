import pool from '../lib/db';

async function revertTwoBookings() {
  try {
    console.log('=== REVERTING TIMESTAMPS FOR 2 BOOKINGS ===\n');

    // Check before
    const before = await pool.query(`
      SELECT booking_id, invitee_name, booking_invitee_time, booking_start_at, booking_end_at
      FROM bookings 
      WHERE booking_id::text IN ('675586', '674913')
      ORDER BY booking_id
    `);

    console.log('BEFORE:');
    before.rows.forEach(row => {
      console.log(`\n${row.invitee_name}:`);
      console.log(`  Expected: ${row.booking_invitee_time}`);
      console.log(`  Start: ${row.booking_start_at}`);
      console.log(`  End: ${row.booking_end_at}`);
    });

    // Revert by subtracting 5.5 hours
    await pool.query(`
      UPDATE bookings
      SET 
        booking_start_at = booking_start_at - INTERVAL '5 hours 30 minutes',
        booking_end_at = booking_end_at - INTERVAL '5 hours 30 minutes'
      WHERE booking_id::text IN ('675586', '674913')
    `);

    console.log('\n✅ Reverted!\n');

    // Check after
    const after = await pool.query(`
      SELECT booking_id, invitee_name, booking_invitee_time, booking_start_at, booking_end_at
      FROM bookings 
      WHERE booking_id::text IN ('675586', '674913')
      ORDER BY booking_id
    `);

    console.log('AFTER:');
    after.rows.forEach(row => {
      console.log(`\n${row.invitee_name}:`);
      console.log(`  Expected: ${row.booking_invitee_time}`);
      console.log(`  Start: ${row.booking_start_at}`);
      console.log(`  End: ${row.booking_end_at}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

revertTwoBookings();
