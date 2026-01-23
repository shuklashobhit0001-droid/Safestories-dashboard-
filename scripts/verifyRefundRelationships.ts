import pool from '../lib/db';

async function verifyRefundRelationships() {
  try {
    console.log('=== Checking refund_cancellation_table.session_id → bookings.booking_id ===\n');
    
    const sessionIdCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM refund_cancellation_table) as total_refund_records,
        (SELECT COUNT(*) FROM refund_cancellation_table r 
         WHERE EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = r.session_id)) as matching_session_ids,
        (SELECT COUNT(*) FROM refund_cancellation_table r 
         WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = r.session_id)) as orphaned_session_ids
    `);
    
    console.log('Session ID Matching:');
    console.log(sessionIdCheck.rows[0]);
    console.log('');

    console.log('=== Checking refund_cancellation_table.payment_id → payments.payment_id ===\n');
    
    const paymentIdCheck = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM refund_cancellation_table WHERE payment_id IS NOT NULL) as total_with_payment_id,
        (SELECT COUNT(*) FROM refund_cancellation_table r 
         WHERE r.payment_id IS NOT NULL 
         AND EXISTS (SELECT 1 FROM payments p WHERE p.payment_id::text = r.payment_id)) as matching_payment_ids,
        (SELECT COUNT(*) FROM refund_cancellation_table r 
         WHERE r.payment_id IS NOT NULL 
         AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.payment_id::text = r.payment_id)) as orphaned_payment_ids
    `);
    
    console.log('Payment ID Matching:');
    console.log(paymentIdCheck.rows[0]);
    console.log('');

    // Sample mismatches
    console.log('=== Sample Orphaned Session IDs (if any) ===\n');
    const orphanedSessions = await pool.query(`
      SELECT session_id, client_name, session_timings 
      FROM refund_cancellation_table r
      WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = r.session_id)
      LIMIT 5
    `);
    console.log(orphanedSessions.rows);
    console.log('');

    console.log('=== Sample Orphaned Payment IDs (if any) ===\n');
    const orphanedPayments = await pool.query(`
      SELECT payment_id, client_name, session_id
      FROM refund_cancellation_table r
      WHERE r.payment_id IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.payment_id::text = r.payment_id)
      LIMIT 5
    `);
    console.log(orphanedPayments.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyRefundRelationships();
