import pool from '../lib/db';

async function populateAllTables() {
  try {
    console.log('Starting to populate all tables...\n');

    // Step 1: Populate all_clients_table
    console.log('Step 1: Populating all_clients_table...');
    await pool.query(`
      INSERT INTO all_clients_table (client_id, client_name, phone_number, email_id, no_of_sessions, therapist_id, assigned_therapist)
      SELECT 
        invitee_id as client_id,
        invitee_name as client_name,
        invitee_phone as phone_number,
        invitee_email as email_id,
        COUNT(*) as no_of_sessions,
        booking_host_user_id as therapist_id,
        booking_host_name as assigned_therapist
      FROM bookings
      WHERE invitee_id IS NOT NULL
      GROUP BY invitee_id, invitee_name, invitee_phone, invitee_email, booking_host_user_id, booking_host_name
      ON CONFLICT (client_id) DO UPDATE SET
        no_of_sessions = EXCLUDED.no_of_sessions,
        therapist_id = EXCLUDED.therapist_id,
        assigned_therapist = EXCLUDED.assigned_therapist
    `);
    const clientCount = await pool.query('SELECT COUNT(*) FROM all_clients_table');
    console.log(`✓ Populated all_clients_table with ${clientCount.rows[0].count} clients\n`);

    // Step 2: Populate appointment_table
    console.log('Step 2: Populating appointment_table...');
    await pool.query(`
      INSERT INTO appointment_table (session_id, session_timings, session_name, session_mode, client_id, client_name, contact_info, therapist_id, therapist_name)
      SELECT 
        booking_id as session_id,
        booking_start_at as session_timings,
        booking_resource_name as session_name,
        booking_mode as session_mode,
        invitee_id as client_id,
        invitee_name as client_name,
        CONCAT(invitee_phone, ' | ', invitee_email) as contact_info,
        booking_host_user_id as therapist_id,
        booking_host_name as therapist_name
      FROM bookings
      WHERE booking_id IS NOT NULL
      ON CONFLICT (session_id) DO UPDATE SET
        session_timings = EXCLUDED.session_timings,
        session_mode = EXCLUDED.session_mode,
        therapist_id = EXCLUDED.therapist_id
    `);
    const appointmentCount = await pool.query('SELECT COUNT(*) FROM appointment_table');
    console.log(`✓ Populated appointment_table with ${appointmentCount.rows[0].count} appointments\n`);

    // Step 3: Populate refund_cancellation_table
    console.log('Step 3: Populating refund_cancellation_table...');
    await pool.query(`
      INSERT INTO refund_cancellation_table (client_id, client_name, session_id, session_name, session_timings, payment_id, payment_status)
      SELECT 
        invitee_id as client_id,
        invitee_name as client_name,
        booking_id as session_id,
        booking_resource_name as session_name,
        booking_start_at as session_timings,
        invitee_payment_reference_id as payment_id,
        COALESCE(refund_status, 'pending') as payment_status
      FROM bookings
      WHERE booking_status = 'cancelled' 
        AND booking_id IS NOT NULL
    `);
    const refundCount = await pool.query('SELECT COUNT(*) FROM refund_cancellation_table');
    console.log(`✓ Populated refund_cancellation_table with ${refundCount.rows[0].count} refunds/cancellations\n`);

    // Step 4: Add Foreign Key Constraints
    console.log('Step 4: Adding foreign key constraints...');
    
    // all_clients_table -> therapists
    await pool.query(`
      ALTER TABLE all_clients_table 
      DROP CONSTRAINT IF EXISTS fk_client_therapist;
      
      ALTER TABLE all_clients_table 
      ADD CONSTRAINT fk_client_therapist 
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id);
    `);
    console.log('✓ Added FK: all_clients_table.therapist_id → therapists.therapist_id');

    // appointment_table -> all_clients_table
    await pool.query(`
      ALTER TABLE appointment_table 
      DROP CONSTRAINT IF EXISTS fk_appointment_client;
      
      ALTER TABLE appointment_table 
      ADD CONSTRAINT fk_appointment_client 
      FOREIGN KEY (client_id) REFERENCES all_clients_table(client_id);
    `);
    console.log('✓ Added FK: appointment_table.client_id → all_clients_table.client_id');

    // appointment_table -> therapists
    await pool.query(`
      ALTER TABLE appointment_table 
      DROP CONSTRAINT IF EXISTS fk_appointment_therapist;
      
      ALTER TABLE appointment_table 
      ADD CONSTRAINT fk_appointment_therapist 
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id);
    `);
    console.log('✓ Added FK: appointment_table.therapist_id → therapists.therapist_id');

    // refund_cancellation_table -> all_clients_table
    await pool.query(`
      ALTER TABLE refund_cancellation_table 
      DROP CONSTRAINT IF EXISTS fk_refund_client;
      
      ALTER TABLE refund_cancellation_table 
      ADD CONSTRAINT fk_refund_client 
      FOREIGN KEY (client_id) REFERENCES all_clients_table(client_id);
    `);
    console.log('✓ Added FK: refund_cancellation_table.client_id → all_clients_table.client_id');

    // refund_cancellation_table -> appointment_table
    await pool.query(`
      ALTER TABLE refund_cancellation_table 
      DROP CONSTRAINT IF EXISTS fk_refund_session;
      
      ALTER TABLE refund_cancellation_table 
      ADD CONSTRAINT fk_refund_session 
      FOREIGN KEY (session_id) REFERENCES appointment_table(session_id);
    `);
    console.log('✓ Added FK: refund_cancellation_table.session_id → appointment_table.session_id');

    console.log('\n✅ All tables populated and connected successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Clients: ${clientCount.rows[0].count}`);
    console.log(`   - Appointments: ${appointmentCount.rows[0].count}`);
    console.log(`   - Refunds/Cancellations: ${refundCount.rows[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populateAllTables();
