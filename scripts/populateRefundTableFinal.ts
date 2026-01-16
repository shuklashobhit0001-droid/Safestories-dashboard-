import pool from '../lib/db';

async function populateRefundTable() {
  try {
    console.log('🔄 Step 1: Adding clients to all_clients_table...\n');

    await pool.query(`
      INSERT INTO all_clients_table (client_id, client_name, email_id, phone_number)
      SELECT DISTINCT 
        invitee_id,
        invitee_name,
        invitee_email,
        invitee_phone
      FROM bookings
      WHERE booking_status IN ('cancelled', 'canceled')
      ON CONFLICT (client_id) DO NOTHING;
    `);

    console.log('✅ Clients added\n');

    console.log('🔄 Step 2: Populating refund_cancellation_table...\n');

    const result = await pool.query(`
      INSERT INTO refund_cancellation_table 
        (client_id, client_name, session_id, session_name, session_timings, payment_id, payment_status)
      SELECT 
        invitee_id,
        invitee_name,
        booking_id,
        booking_resource_name,
        booking_start_at,
        invitee_payment_reference_id,
        COALESCE(refund_status, 'Pending')
      FROM bookings
      WHERE booking_status IN ('cancelled', 'canceled')
      RETURNING *;
    `);

    console.log(`✅ Inserted ${result.rows.length} records\n`);
    
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.client_name} - ${row.session_name} - ${row.payment_status}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateRefundTable();
