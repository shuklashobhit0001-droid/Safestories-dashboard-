import pool from '../lib/db';

async function createAutoSyncTrigger() {
  try {
    console.log('🔄 Creating auto-sync trigger for refund_cancellation_table...\n');

    // Create trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION sync_refund_cancellation()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only sync if booking is cancelled
        IF NEW.booking_status IN ('cancelled', 'canceled') THEN
          
          -- Ensure client exists in all_clients_table
          INSERT INTO all_clients_table (client_id, client_name, email_id, phone_number)
          VALUES (NEW.invitee_id, NEW.invitee_name, NEW.invitee_email, NEW.invitee_phone)
          ON CONFLICT (client_id) DO NOTHING;
          
          -- Ensure appointment exists in appointment_table
          INSERT INTO appointment_table (session_id, client_id, client_name, session_name, session_timings, contact_info)
          VALUES (NEW.booking_id, NEW.invitee_id, NEW.invitee_name, NEW.booking_resource_name, NEW.booking_start_at, NEW.invitee_phone)
          ON CONFLICT (session_id) DO NOTHING;
          
          -- Insert or update refund_cancellation_table
          INSERT INTO refund_cancellation_table 
            (client_id, client_name, session_id, session_name, session_timings, payment_id, refund_status)
          VALUES 
            (NEW.invitee_id, NEW.invitee_name, NEW.booking_id, NEW.booking_resource_name, 
             NEW.booking_start_at, NEW.invitee_payment_reference_id, COALESCE(NEW.refund_status, 'Pending'))
          ON CONFLICT (session_id) 
          DO UPDATE SET 
            refund_status = COALESCE(NEW.refund_status, 'Pending'),
            session_timings = NEW.booking_start_at;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Trigger function created\n');

    // Drop existing trigger if exists
    await pool.query(`
      DROP TRIGGER IF EXISTS trg_sync_refund_cancellation ON bookings;
    `);

    // Create trigger
    await pool.query(`
      CREATE TRIGGER trg_sync_refund_cancellation
      AFTER INSERT OR UPDATE OF booking_status, refund_status ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION sync_refund_cancellation();
    `);

    console.log('✅ Trigger created successfully!\n');
    console.log('📋 Trigger will auto-sync when:');
    console.log('   - New booking is cancelled');
    console.log('   - Booking status changes to cancelled');
    console.log('   - Refund status is updated');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAutoSyncTrigger();
