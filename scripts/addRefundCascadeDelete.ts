import pool from '../lib/db.js';

async function addCascadeDelete() {
  try {
    console.log('🔗 Adding CASCADE DELETE to refund_cancellation_table...\n');

    // Drop existing foreign key if exists
    await pool.query(`
      ALTER TABLE refund_cancellation_table 
      DROP CONSTRAINT IF EXISTS fk_refund_session_id;
    `);

    // Add foreign key with CASCADE DELETE
    await pool.query(`
      ALTER TABLE refund_cancellation_table
      ADD CONSTRAINT fk_refund_session_id
      FOREIGN KEY (session_id) 
      REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);

    console.log('✅ CASCADE DELETE added successfully!\n');
    console.log('📋 Now when a booking is deleted, refund entry will auto-delete');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addCascadeDelete();
