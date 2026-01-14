import pool from '../lib/db';

async function verifyStats() {
  try {
    console.log('Checking dashboard stats...\n');

    // Revenue (excluding cancelled)
    const revenueResult = await pool.query(
      "SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status != 'cancelled'"
    );
    console.log('Revenue:', revenueResult.rows[0].total);

    // Sessions (confirmed + rescheduled)
    const sessionsResult = await pool.query(
      "SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ('confirmed', 'rescheduled')"
    );
    console.log('Sessions:', sessionsResult.rows[0].total);

    // Free Consultations (payment = 0 or NULL)
    const freeConsultResult = await pool.query(
      "SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)"
    );
    console.log('Free Consultations:', freeConsultResult.rows[0].total);

    // Cancelled
    const cancelledResult = await pool.query(
      "SELECT COUNT(*) as total FROM bookings WHERE booking_status = 'cancelled'"
    );
    console.log('Cancelled:', cancelledResult.rows[0].total);

    console.log('\n--- Detailed Breakdown ---\n');

    // All bookings with status and payment
    const detailsResult = await pool.query(
      "SELECT booking_status, invitee_payment_amount, COUNT(*) as count FROM bookings GROUP BY booking_status, invitee_payment_amount ORDER BY booking_status, invitee_payment_amount"
    );
    console.log('Bookings by status and payment:');
    detailsResult.rows.forEach(row => {
      console.log(`  Status: ${row.booking_status}, Payment: ${row.invitee_payment_amount}, Count: ${row.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyStats();
