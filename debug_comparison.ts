import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugComparison() {
  console.log('🔍 Debugging Comparison Issue...\n');

  const result = await pool.query(`
    SELECT 
      invitee_name,
      booking_end_at,
      NOW() as now_value,
      booking_end_at::timestamp as end_timestamp,
      NOW()::timestamp as now_timestamp,
      booking_end_at::timestamp >= NOW()::timestamp as comparison_result,
      EXTRACT(EPOCH FROM booking_end_at::timestamp) as end_epoch,
      EXTRACT(EPOCH FROM NOW()::timestamp) as now_epoch
    FROM bookings
    WHERE invitee_name = 'Rohan Chavan'
      AND booking_start_at::date = '2026-02-18'
  `);

  result.rows.forEach(row => {
    console.log(`${row.invitee_name}:`);
    console.log(`  booking_end_at: ${row.booking_end_at}`);
    console.log(`  NOW(): ${row.now_value}`);
    console.log(`  End timestamp: ${row.end_timestamp}`);
    console.log(`  Now timestamp: ${row.now_timestamp}`);
    console.log(`  End epoch: ${row.end_epoch}`);
    console.log(`  Now epoch: ${row.now_epoch}`);
    console.log(`  Comparison (end >= now): ${row.comparison_result}`);
    console.log(`  Difference (seconds): ${row.end_epoch - row.now_epoch}`);
  });

  await pool.end();
}

debugComparison().catch(console.error);
