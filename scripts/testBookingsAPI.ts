import pool from '../lib/db';

async function test() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name as client_name,
        booking_resource_name as therapy_type,
        booking_mode as mode,
        booking_host_name as therapist_name,
        booking_invitee_time as booking_start_at,
        bookings.booking_start_at as sort_date
      FROM bookings
      WHERE booking_status != 'cancelled'
        AND bookings.booking_start_at >= CURRENT_DATE
      ORDER BY bookings.booking_start_at ASC
      LIMIT 10
    `);
    
    console.log('API Result:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
