import pool from '../lib/db.js';

async function setupProductionTriggers() {
  console.log('=== Setting Up Production Database Triggers ===\n');

  try {
    console.log('Running on production database...\n');

    // 1. Create booking notification function
    console.log('1. Creating booking notification function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION notify_on_booking()
      RETURNS TRIGGER AS $$
      DECLARE
        admin_record RECORD;
        therapist_user_id TEXT;
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
            INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
            VALUES (
              admin_record.id, 'admin', 'new_booking', 'New Booking Created',
              NEW.invitee_name || ' booked "' || NEW.booking_resource_name || '" with ' || NEW.booking_host_name,
              NEW.booking_id::text
            );
          END LOOP;
          
          IF NEW.therapist_id IS NOT NULL THEN
            SELECT id INTO therapist_user_id FROM users WHERE therapist_id = NEW.therapist_id AND role = 'therapist' LIMIT 1;
            IF therapist_user_id IS NOT NULL THEN
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                therapist_user_id, 'therapist', 'new_booking', 'New Booking Assigned',
                'New session "' || NEW.booking_resource_name || '" booked with ' || NEW.invitee_name,
                NEW.booking_id::text
              );
            END IF;
          END IF;
          
        ELSIF (TG_OP = 'UPDATE') THEN
          IF OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                admin_record.id, 'admin', 'booking_cancelled', 'Booking Cancelled',
                'Session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been cancelled',
                NEW.booking_id::text
              );
            END LOOP;
            
            IF NEW.therapist_id IS NOT NULL THEN
              SELECT id INTO therapist_user_id FROM users WHERE therapist_id = NEW.therapist_id AND role = 'therapist' LIMIT 1;
              IF therapist_user_id IS NOT NULL THEN
                INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
                VALUES (
                  therapist_user_id, 'therapist', 'booking_cancelled', 'Session Cancelled',
                  'Your session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been cancelled',
                  NEW.booking_id::text
                );
              END IF;
            END IF;
          END IF;
          
          IF OLD.booking_status != 'rescheduled' AND NEW.booking_status = 'rescheduled' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                admin_record.id, 'admin', 'booking_rescheduled', 'Booking Rescheduled',
                'Session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been rescheduled',
                NEW.booking_id::text
              );
            END LOOP;
            
            IF NEW.therapist_id IS NOT NULL THEN
              SELECT id INTO therapist_user_id FROM users WHERE therapist_id = NEW.therapist_id AND role = 'therapist' LIMIT 1;
              IF therapist_user_id IS NOT NULL THEN
                INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
                VALUES (
                  therapist_user_id, 'therapist', 'booking_rescheduled', 'Session Rescheduled',
                  'Your session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been rescheduled',
                  NEW.booking_id::text
                );
              END IF;
            END IF;
          END IF;
          
          IF OLD.booking_status != 'no_show' AND NEW.booking_status = 'no_show' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                admin_record.id, 'admin', 'no_show', 'Client No-Show',
                NEW.invitee_name || ' did not show up for session "' || NEW.booking_resource_name || '"',
                NEW.booking_id::text
              );
            END LOOP;
          END IF;
          
          IF (OLD.refund_status IS NULL OR OLD.refund_status != 'requested') AND NEW.refund_status = 'requested' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                admin_record.id, 'admin', 'refund_requested', 'Refund Requested',
                NEW.invitee_name || ' requested a refund of ₹' || COALESCE(NEW.refund_amount::text, '0'),
                NEW.booking_id::text
              );
            END LOOP;
          END IF;
          
          IF (OLD.refund_status IS NULL OR (OLD.refund_status != 'completed' AND OLD.refund_status != 'processed')) 
             AND (NEW.refund_status = 'completed' OR NEW.refund_status = 'processed') THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                admin_record.id, 'admin', 'refund_processed', 'Refund Completed',
                'Refund of ₹' || COALESCE(NEW.refund_amount::text, '0') || ' processed for ' || NEW.invitee_name,
                NEW.booking_id::text
              );
            END LOOP;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Done\n');

    // 2. Create client transfer notification function
    console.log('2. Creating client transfer notification function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION notify_on_client_transfer()
      RETURNS TRIGGER AS $$
      DECLARE
        admin_record RECORD;
        old_therapist_user_id TEXT;
        new_therapist_user_id TEXT;
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
            INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
            VALUES (
              admin_record.id, 'admin', 'client_transfer', 'Client Transfer Completed',
              NEW.client_name || ' transferred from ' || NEW.from_therapist_name || ' to ' || NEW.to_therapist_name,
              NEW.transfer_id::text
            );
          END LOOP;
          
          IF NEW.from_therapist_id IS NOT NULL THEN
            SELECT id INTO old_therapist_user_id FROM users WHERE therapist_id = NEW.from_therapist_id AND role = 'therapist' LIMIT 1;
            IF old_therapist_user_id IS NOT NULL THEN
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                old_therapist_user_id, 'therapist', 'client_transfer_out', 'Client Transferred',
                'Client ' || NEW.client_name || ' has been transferred to ' || NEW.to_therapist_name,
                NEW.transfer_id::text
              );
            END IF;
          END IF;
          
          IF NEW.to_therapist_id IS NOT NULL THEN
            SELECT id INTO new_therapist_user_id FROM users WHERE therapist_id = NEW.to_therapist_id AND role = 'therapist' LIMIT 1;
            IF new_therapist_user_id IS NOT NULL THEN
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                new_therapist_user_id, 'therapist', 'client_transfer_in', 'New Client Assigned',
                'Client ' || NEW.client_name || ' has been transferred to you from ' || NEW.from_therapist_name,
                NEW.transfer_id::text
              );
            END IF;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Done\n');

    // 3. Create session notes notification function
    console.log('3. Creating session notes notification function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION notify_on_session_notes()
      RETURNS TRIGGER AS $$
      DECLARE
        admin_record RECORD;
        booking_record RECORD;
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          SELECT invitee_name, booking_host_name INTO booking_record FROM bookings WHERE booking_id = NEW.booking_id LIMIT 1;
          
          IF booking_record IS NOT NULL THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
              VALUES (
                admin_record.id, 'admin', 'session_notes_submitted', 'Session Notes Submitted',
                booking_record.booking_host_name || ' submitted session notes for ' || booking_record.invitee_name,
                NEW.booking_id::text
              );
            END LOOP;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Done\n');

    // 4. Drop existing triggers
    console.log('4. Dropping old triggers...');
    await pool.query(`DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;`);
    await pool.query(`DROP TRIGGER IF EXISTS transfer_notification_trigger ON client_transfer_history;`);
    await pool.query(`DROP TRIGGER IF EXISTS session_notes_notification_trigger ON client_session_notes;`);
    console.log('✓ Done\n');

    // 5. Create new triggers
    console.log('5. Creating new triggers...');
    await pool.query(`
      CREATE TRIGGER booking_notification_trigger
      AFTER INSERT OR UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_booking();
    `);
    
    await pool.query(`
      CREATE TRIGGER transfer_notification_trigger
      AFTER INSERT ON client_transfer_history
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_client_transfer();
    `);
    
    await pool.query(`
      CREATE TRIGGER session_notes_notification_trigger
      AFTER INSERT ON client_session_notes
      FOR EACH ROW
      EXECUTE FUNCTION notify_on_session_notes();
    `);
    console.log('✓ Done\n');

    console.log('=== ✅ SUCCESS ===');
    console.log('Production database triggers are now active!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

setupProductionTriggers();
