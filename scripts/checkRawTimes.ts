import pool from '../lib/db';

async function checkRawTimes() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        booking_start_at,
        booking_start_at AT TIME ZONE 'UTC' as utc_time,
        NOW() as current_time,
        NOW() AT TIME ZONE 'UTC' as current_utc,
        booking_start_at < NOW() as is_past
      FROM bookings
      WHERE invitee_name IN ('Muskan', 'Samara Grewal')
      AND booking_start_at::date = '2026-01-27'
    `);

    console.log('=== RAW TIME CHECK ===\n');
    result.rows.forEach(row => {
      console.log(`${row.invitee_name}:`);
      console.log(`  booking_start_at (IST): ${row.booking_start_at}`);
      console.log(`  UTC time: ${row.utc_time}`);
      console.log(`  Current time (IST): ${row.current_time}`);
      console.log(`  Current UTC: ${row.current_utc}`);
      console.log(`  Is past: ${row.is_past}`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRawTimes();
