import pool from '../api/lib/db.js';

async function checkFreeConsultations() {
  try {
    // Check booking_requests table
    const bookingRequests = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_free_consultation = true THEN 1 END) as free_consultations
      FROM booking_requests
    `);

    console.log('Booking Requests Table:');
    console.log(bookingRequests.rows[0]);

    // Check all records
    const allRequests = await pool.query(`
      SELECT * FROM booking_requests
    `);

    console.log('\nAll Booking Requests:');
    console.log(allRequests.rows);

    // Check bookings table for free consultation patterns
    const bookingsWithFree = await pool.query(`
      SELECT 
        booking_id, 
        invitee_name, 
        booking_subject,
        invitee_payment_amount,
        booking_status
      FROM bookings
      WHERE LOWER(booking_subject) LIKE '%free%'
         OR invitee_payment_amount = 0
         OR invitee_payment_amount IS NULL
    `);

    console.log('\nBookings with Free/Zero Amount:');
    console.log(bookingsWithFree.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkFreeConsultations();
