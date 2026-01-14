import pool from '../lib/db';

async function showFreeConsultations() {
  try {
    const result = await pool.query(
      `SELECT 
        booking_id,
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_resource_name,
        booking_status,
        invitee_payment_amount,
        booking_start_at,
        booking_invitee_time
      FROM bookings 
      WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)
      ORDER BY booking_start_at`
    );

    console.log(`\nFree Consultations (${result.rows.length} total):\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Booking ID: ${row.booking_id}`);
      console.log(`   Client: ${row.invitee_name}`);
      console.log(`   Phone: ${row.invitee_phone}`);
      console.log(`   Email: ${row.invitee_email}`);
      console.log(`   Therapist: ${row.booking_host_name}`);
      console.log(`   Therapy Type: ${row.booking_resource_name}`);
      console.log(`   Status: ${row.booking_status}`);
      console.log(`   Payment: ${row.invitee_payment_amount === null ? 'NULL' : '₹' + row.invitee_payment_amount}`);
      console.log(`   Date: ${row.booking_start_at}`);
      console.log(`   Time: ${row.booking_invitee_time}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showFreeConsultations();
