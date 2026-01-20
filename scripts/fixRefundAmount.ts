import pool from '../lib/db.js';

async function fixRefundAmount() {
  console.log('=== FIXING REFUND AMOUNT ===\n');

  try {
    // Check current value
    console.log('1. BEFORE FIX:');
    const { rows: before } = await pool.query(
      'SELECT booking_id, invitee_name, refund_amount, invitee_payment_amount FROM bookings WHERE booking_id = $1',
      ['666687']
    );
    console.log(`Booking: ${before[0].booking_id}`);
    console.log(`Client: ${before[0].invitee_name}`);
    console.log(`Refund Amount: ₹${before[0].refund_amount}`);
    console.log(`Payment Amount: ₹${before[0].invitee_payment_amount}\n`);

    // Fix the data
    console.log('2. APPLYING FIX...');
    await pool.query(
      'UPDATE bookings SET refund_amount = invitee_payment_amount WHERE booking_id = $1',
      ['666687']
    );
    console.log('✓ Updated refund_amount to match payment amount\n');

    // Verify fix
    console.log('3. AFTER FIX:');
    const { rows: after } = await pool.query(
      'SELECT booking_id, invitee_name, refund_amount, invitee_payment_amount FROM bookings WHERE booking_id = $1',
      ['666687']
    );
    console.log(`Booking: ${after[0].booking_id}`);
    console.log(`Client: ${after[0].invitee_name}`);
    console.log(`Refund Amount: ₹${after[0].refund_amount}`);
    console.log(`Payment Amount: ₹${after[0].invitee_payment_amount}\n`);

    console.log('=== FIX COMPLETE ===');
    console.log(`Changed: ₹${before[0].refund_amount} → ₹${after[0].refund_amount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixRefundAmount();
