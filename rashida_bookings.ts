import pool from './lib/db';

async function getRashidaBookings() {
  try {
    const result = await pool.query(`
      SELECT
        booking_id,
        invitee_name,
        booking_resource_name as session_name,
        booking_host_name as therapist,
        booking_status,
        booking_start_at as date,
        booking_duration,
        booking_mode
      FROM bookings
      WHERE invitee_phone LIKE '%9172765%' OR invitee_phone LIKE '%63554%'
      ORDER BY booking_start_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('No bookings found');
      process.exit(0);
    }

    console.log('\n📅 Rashida Booking History:\n');
    result.rows.forEach((row: any, idx: number) => {
      const date = new Date(row.date);
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      console.log(`${idx + 1}. ${row.session_name}`);
      console.log(`   Date: ${formattedDate}`);
      console.log(`   Duration: ${row.booking_duration} min`);
      console.log(`   Mode: ${row.booking_mode || 'N/A'}`);
      console.log(`   Therapist: ${row.therapist}`);
      console.log(`   Status: ${row.booking_status}`);
      console.log(`   Booking ID: ${row.booking_id}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getRashidaBookings();
