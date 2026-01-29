import pool from '../lib/db';

async function checkUpcomingIssue() {
  try {
    console.log('=== CHECKING UPCOMING APPOINTMENTS ISSUE ===\n');

    // Get current DB time
    const now = await pool.query('SELECT NOW() as db_time, CURRENT_TIMESTAMP as current_ts');
    console.log(`Database NOW(): ${now.rows[0].db_time}`);
    console.log(`Current Timestamp: ${now.rows[0].current_ts}\n`);

    // Get the 6 appointments shown in Vercel
    const names = ['Meera', 'Siddharth Gautam', 'Nikita Jain', 'Simone Pinto', 'Muskan', 'Samara Grewal'];
    
    console.log('=== CHECKING EACH APPOINTMENT ===\n');
    
    for (const name of names) {
      const result = await pool.query(`
        SELECT 
          booking_id,
          invitee_name,
          booking_invitee_time,
          booking_start_at,
          booking_start_at > NOW() as is_upcoming,
          EXTRACT(EPOCH FROM (booking_start_at - NOW())) / 3600 as hours_from_now
        FROM bookings
        WHERE invitee_name ILIKE $1
        AND booking_start_at::date >= '2026-01-27'
        ORDER BY booking_start_at
        LIMIT 1
      `, [`%${name}%`]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log(`${row.invitee_name}:`);
        console.log(`  Expected: ${row.booking_invitee_time}`);
        console.log(`  DB Start: ${row.booking_start_at}`);
        console.log(`  Is Upcoming: ${row.is_upcoming}`);
        console.log(`  Hours from now: ${parseFloat(row.hours_from_now).toFixed(2)}`);
        console.log('');
      }
    }

    // Check what the API query returns
    console.log('\n=== API QUERY SIMULATION ===');
    console.log('Query: booking_start_at > NOW() AND status NOT IN (cancelled, no_show)\n');

    const apiQuery = await pool.query(`
      SELECT 
        invitee_name,
        booking_invitee_time,
        booking_start_at,
        booking_status
      FROM bookings
      WHERE booking_start_at > NOW()
      AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
      ORDER BY booking_start_at ASC
    `);

    console.log(`Total upcoming (API would return): ${apiQuery.rows.length}\n`);
    
    apiQuery.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.invitee_name}`);
      console.log(`   Expected: ${row.booking_invitee_time}`);
      console.log(`   DB: ${row.booking_start_at}`);
    });

    // Check timezone settings
    console.log('\n\n=== TIMEZONE CHECK ===');
    const tz = await pool.query('SHOW timezone');
    console.log(`Database timezone: ${tz.rows[0].TimeZone}`);

    // Check if Muskan and Samara are in the past
    console.log('\n\n=== SPECIFIC CHECK: Muskan & Samara ===');
    const twoBookings = await pool.query(`
      SELECT 
        invitee_name,
        booking_start_at,
        NOW() as current_time,
        booking_start_at > NOW() as is_future,
        booking_start_at < NOW() as is_past
      FROM bookings
      WHERE invitee_name IN ('Muskan', 'Samara Grewal')
      AND booking_start_at::date = '2026-01-27'
    `);

    twoBookings.rows.forEach(row => {
      console.log(`\n${row.invitee_name}:`);
      console.log(`  Booking time: ${row.booking_start_at}`);
      console.log(`  Current time: ${row.current_time}`);
      console.log(`  Is Future: ${row.is_future}`);
      console.log(`  Is Past: ${row.is_past}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUpcomingIssue();
