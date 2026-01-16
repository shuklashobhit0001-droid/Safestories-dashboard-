import pool from '../lib/db';

async function populateRefundTable() {
  try {
    console.log('🔄 Step 1: Adding clients...\n');
    await pool.query(`
      INSERT INTO all_clients_table (client_id, client_name, email_id, phone_number)
      SELECT DISTINCT invitee_id, invitee_name, invitee_email, invitee_phone
      FROM bookings WHERE booking_status IN ('cancelled', 'canceled')
      ON CONFLICT (client_id) DO NOTHING;
    `);
    console.log('✅ Done\n');

    console.log('🔄 Step 2: Adding appointments...\n');
    await pool.query(`
      INSERT INTO appointment_table (session_id, client_id, client_name, session_name, session_timings, contact_info)
      SELECT DISTINCT booking_id, invitee_id, invitee_name, booking_resource_name, booking_start_at, invitee_phone
      FROM bookings WHERE booking_status IN ('cancelled', 'canceled')
      ON CONFLICT (session_id) DO NOTHING;
    `);
    console.log('✅ Done\n');

    console.log('🔄 Step 3: Populating refund_cancellation_table...\n');
    const result = await pool.query(`
      INSERT INTO refund_cancellation_table 
        (client_id, client_name, session_id, session_name, session_timings, payment_id, payment_status)
      SELECT invitee_id, invitee_name, booking_id, booking_resource_name, 
             booking_start_at, invitee_payment_reference_id, COALESCE(refund_status, 'Pending')
      FROM bookings WHERE booking_status IN ('cancelled', 'canceled')
      RETURNING *;
    `);

    console.log(`✅ Inserted ${result.rows.length} records:\n`);
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.client_name} - ${row.payment_status}`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateRefundTable();
