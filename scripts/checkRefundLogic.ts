import pool from '../lib/db';

async function checkRefundLogic() {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_status,
        b.refund_status,
        r.refund_status as refund_table_status
      FROM bookings b
      LEFT JOIN refund_cancellation_table r ON b.booking_id = r.session_id
      WHERE b.booking_id IN ('666687', '673116', '673133')
    `);
    
    console.log('Refund entries status:\n');
    result.rows.forEach(row => {
      console.log(`Booking ID: ${row.booking_id}`);
      console.log(`  booking_status: ${row.booking_status}`);
      console.log(`  refund_status (bookings): ${row.refund_status}`);
      console.log(`  refund_status (refund_table): ${row.refund_table_status}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRefundLogic();
