import pool from '../lib/db';

async function checkCancelledBookings() {
  try {
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_status,
        booking_resource_name as session_name,
        booking_start_at,
        booking_end_at,
        invitee_cancelled_at,
        invitee_cancelled_reason,
        booking_cancelled_by,
        booking_cancel_reason,
        refund_status,
        refund_amount,
        invitee_payment_amount,
        invitee_payment_gateway,
        therapist_id,
        booking_host_name as therapist_name
      FROM bookings 
      WHERE booking_status = 'cancelled' 
      ORDER BY invitee_cancelled_at DESC
    `);
    
    console.log(`\n=== CANCELLED BOOKINGS IN DATABASE ===`);
    console.log(`Total Cancelled Bookings: ${result.rows.length}\n`);
    
    if (result.rows.length > 0) {
      console.table(result.rows);
      
      // Summary statistics
      const withRefund = result.rows.filter(r => r.refund_status).length;
      const totalRefundAmount = result.rows.reduce((sum, r) => sum + (parseFloat(r.refund_amount) || 0), 0);
      
      console.log('\n=== SUMMARY ===');
      console.log(`Total Cancelled: ${result.rows.length}`);
      console.log(`With Refund Status: ${withRefund}`);
      console.log(`Total Refund Amount: ₹${totalRefundAmount}`);
    } else {
      console.log('No cancelled bookings found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCancelledBookings();
