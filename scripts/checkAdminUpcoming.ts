import pool from '../lib/db';

async function checkAdminUpcoming() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name as client_name,
        booking_resource_name as therapy_type,
        booking_host_name as therapist_name,
        booking_invitee_time,
        booking_start_at
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
        AND booking_start_at + INTERVAL '50 minutes' >= NOW()
      ORDER BY booking_start_at ASC
      LIMIT 10
    `);

    console.log('Admin Dashboard Upcoming Bookings:\n');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.client_name} - ${row.therapy_type}`);
      console.log(`   Therapist: ${row.therapist_name}`);
      console.log(`   Time: ${row.booking_invitee_time}`);
      console.log(`   Start: ${row.booking_start_at}\n`);
    });
    
    console.log(`Total: ${result.rows.length} bookings`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminUpcoming();
