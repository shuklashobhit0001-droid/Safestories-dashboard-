import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugTimezone() {
  console.log('🔍 Debugging Timezone Issue...\n');

  const result = await pool.query(`
    SELECT 
      NOW() as now_utc,
      NOW() AT TIME ZONE 'Asia/Kolkata' as now_ist,
      invitee_name,
      booking_invitee_time,
      booking_end_at,
      booking_end_at AT TIME ZONE 'UTC' as end_at_utc,
      booking_end_at >= NOW() as is_upcoming
    FROM bookings
    WHERE invitee_name IN ('Rohan Chavan', 'Sanjana ', 'Aarohi', 'Shreya Tiwari ')
      AND booking_start_at::date = '2026-02-18'
    ORDER BY booking_start_at
  `);

  console.log('Database NOW() values:');
  if (result.rows.length > 0) {
    console.log(`  NOW() (UTC): ${result.rows[0].now_utc}`);
    console.log(`  NOW() (IST): ${result.rows[0].now_ist}\n`);
  }

  console.log('Session end times:\n');
  result.rows.forEach(row => {
    console.log(`${row.invitee_name}:`);
    console.log(`  Display: ${row.booking_invitee_time}`);
    console.log(`  booking_end_at: ${row.booking_end_at}`);
    console.log(`  booking_end_at (UTC): ${row.end_at_utc}`);
    console.log(`  Is upcoming (booking_end_at >= NOW()): ${row.is_upcoming}`);
    console.log('');
  });

  await pool.end();
}

debugTimezone().catch(console.error);
