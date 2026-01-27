import pool from '../lib/db';

async function checkUpcomingAppointments() {
  try {
    console.log('🔍 Checking upcoming appointments in database...\n');

    // Get all upcoming appointments
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_resource_name,
        booking_host_name,
        booking_start_at,
        booking_status,
        booking_mode
      FROM bookings
      WHERE booking_start_at >= NOW()
      ORDER BY booking_start_at ASC
    `);

    console.log(`📊 Total upcoming appointments: ${result.rows.length}\n`);

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.invitee_name} - ${row.booking_resource_name}`);
      console.log(`   Therapist: ${row.booking_host_name}`);
      console.log(`   Date: ${row.booking_start_at}`);
      console.log(`   Status: ${row.booking_status}`);
      console.log(`   Mode: ${row.booking_mode}`);
      console.log(`   Booking ID: ${row.booking_id}\n`);
    });

    // Get count by status
    const statusCount = await pool.query(`
      SELECT booking_status, COUNT(*) as count
      FROM bookings
      WHERE booking_start_at >= NOW()
      GROUP BY booking_status
      ORDER BY count DESC
    `);

    console.log('📈 Upcoming appointments by status:');
    statusCount.rows.forEach(row => {
      console.log(`   ${row.booking_status}: ${row.count}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUpcomingAppointments();
