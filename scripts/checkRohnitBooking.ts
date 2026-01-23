import pool from '../lib/db';

async function checkRohnitBooking() {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.invitee_phone,
        b.booking_resource_name,
        b.booking_invitee_time,
        b.booking_status,
        b.refund_status,
        r.refund_status as refund_table_status
      FROM bookings b
      LEFT JOIN refund_cancellation_table r ON b.booking_id = r.session_id
      WHERE b.invitee_name ILIKE '%Rohnit%'
    `);
    
    console.log('Rohnit Roy booking details:\n');
    result.rows.forEach(row => {
      console.log('Booking ID:', row.booking_id);
      console.log('Name:', row.invitee_name);
      console.log('Phone:', row.invitee_phone);
      console.log('Session:', row.booking_resource_name);
      console.log('Time:', row.booking_invitee_time);
      console.log('Booking Status:', row.booking_status);
      console.log('Refund Status (bookings):', row.refund_status);
      console.log('Refund Status (refund_table):', row.refund_table_status);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRohnitBooking();
