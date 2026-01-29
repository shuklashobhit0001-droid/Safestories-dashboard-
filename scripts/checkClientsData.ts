import pool from '../lib/db';

async function checkClientsData() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_resource_name,
        booking_status,
        1 as session_count,
        invitee_created_at as created_at,
        booking_start_at as latest_booking_date
      FROM bookings
      WHERE invitee_name ILIKE '%Meera%'
      ORDER BY booking_start_at DESC
      LIMIT 3
    `);

    console.log('\n=== Sample Client Data ===\n');
    console.log(JSON.stringify(result.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkClientsData();
