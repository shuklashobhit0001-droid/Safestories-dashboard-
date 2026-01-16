import pool from '../lib/db';

async function createPaymentsTable() {
  try {
    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        booking_id TEXT,
        invitee_name TEXT,
        invitee_email TEXT,
        payment_reference_id TEXT,
        amount DECIMAL(10, 2),
        currency VARCHAR(10),
        payment_date TIMESTAMP,
        payment_gateway_name TEXT,
        refund_amount DECIMAL(10, 2),
        refund_initiation_date TIMESTAMP,
        refund_status VARCHAR(50),
        refund_failed_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Payments table created');

    // Migrate data from bookings
    await pool.query(`
      INSERT INTO payments (
        booking_id, invitee_name, invitee_email, payment_reference_id,
        amount, currency, payment_date, payment_gateway_name,
        refund_amount, refund_initiation_date, refund_status, refund_failed_date
      )
      SELECT 
        booking_id, invitee_name, invitee_email, invitee_payment_reference_id,
        invitee_payment_amount, invitee_payment_currency, invitee_created_at, invitee_payment_gateway,
        refund_amount, invitee_cancelled_at, refund_status, refund_failed_time
      FROM bookings
    `);
    console.log('✓ Migrated data to payments table');

    // Create booking_cancelled table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_cancelled (
        id SERIAL PRIMARY KEY,
        booking_id TEXT,
        invitee_id TEXT,
        invitee_name TEXT,
        invitee_number TEXT,
        invitee_email TEXT,
        cancelled_at TIMESTAMP,
        cancelled_by TEXT,
        cancel_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Booking_cancelled table created');

    // Migrate cancelled bookings
    await pool.query(`
      INSERT INTO booking_cancelled (
        booking_id, invitee_id, invitee_name, invitee_number,
        invitee_email, cancelled_at, cancelled_by, cancel_reason
      )
      SELECT 
        booking_id, invitee_id, invitee_name, invitee_phone,
        invitee_email, invitee_cancelled_at, booking_cancelled_by, booking_cancel_reason
      FROM bookings
      WHERE booking_status = 'cancelled'
    `);
    console.log('✓ Migrated cancelled bookings data');

    const paymentsCount = await pool.query('SELECT COUNT(*) FROM payments');
    const cancelledCount = await pool.query('SELECT COUNT(*) FROM booking_cancelled');
    
    console.log('\n=== Summary ===');
    console.log('Payments records:', paymentsCount.rows[0].count);
    console.log('Cancelled bookings records:', cancelledCount.rows[0].count);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createPaymentsTable();
