import pool from '../lib/db';

async function addRefundBookingFK() {
  try {
    await pool.query(`
      ALTER TABLE refund_cancellation_table
      ADD CONSTRAINT fk_refund_booking
      FOREIGN KEY (session_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    
    console.log('✅ Foreign key added: refund_cancellation_table.session_id → bookings.booking_id');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

addRefundBookingFK();
