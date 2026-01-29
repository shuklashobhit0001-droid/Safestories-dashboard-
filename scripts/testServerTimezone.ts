import pool from '../lib/db';

async function testServerTimezone() {
  try {
    console.log('=== SERVER TIMEZONE TEST ===\n');

    // Check Node.js server time
    const nodeTime = new Date();
    console.log('Node.js Server Time:');
    console.log(`  toString(): ${nodeTime.toString()}`);
    console.log(`  toISOString(): ${nodeTime.toISOString()}`);
    console.log(`  toLocaleString('en-US', {timeZone: 'Asia/Kolkata'}): ${nodeTime.toLocaleString('en-US', {timeZone: 'Asia/Kolkata'})}`);
    console.log(`  Timezone offset: ${nodeTime.getTimezoneOffset()} minutes`);

    // Check database timezone
    const dbTz = await pool.query('SHOW timezone');
    console.log(`\nDatabase timezone: ${dbTz.rows[0].TimeZone}`);

    // Check database NOW()
    const dbNow = await pool.query('SELECT NOW() as db_time, CURRENT_TIMESTAMP as current_ts');
    console.log(`Database NOW(): ${dbNow.rows[0].db_time}`);
    console.log(`Database CURRENT_TIMESTAMP: ${dbNow.rows[0].current_ts}`);

    // Check what the appointments query would return
    const upcomingCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE booking_start_at > NOW()
      AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);
    console.log(`\nUpcoming appointments (booking_start_at > NOW()): ${upcomingCount.rows[0].count}`);

    // Check specific times
    const muskanCheck = await pool.query(`
      SELECT 
        invitee_name,
        booking_start_at,
        NOW() as current_time,
        booking_start_at > NOW() as is_upcoming
      FROM bookings
      WHERE invitee_name = 'Muskan'
      AND booking_start_at::date = '2026-01-27'
    `);

    if (muskanCheck.rows.length > 0) {
      const row = muskanCheck.rows[0];
      console.log(`\nMuskan appointment check:`);
      console.log(`  Booking time: ${row.booking_start_at}`);
      console.log(`  Current time: ${row.current_time}`);
      console.log(`  Is upcoming: ${row.is_upcoming}`);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testServerTimezone();
