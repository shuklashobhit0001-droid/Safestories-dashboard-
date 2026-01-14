import pool from '../lib/db.js';

async function createBookingNotificationTrigger() {
  console.log('=== Creating Automatic Booking Notification Trigger ===\n');

  try {
    // Step 1: Create function to notify admins
    console.log('1. Creating notification function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION notify_admins_on_booking()
      RETURNS TRIGGER AS $$
      DECLARE
        admin_record RECORD;
      BEGIN
        -- Only create notifications for new bookings or status changes
        IF (TG_OP = 'INSERT') THEN
          -- New booking created - notify all admins
          FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
            INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
            VALUES (
              admin_record.id,
              'admin',
              'new_booking',
              'New Booking Created',
              NEW.invitee_name || ' booked "' || NEW.booking_resource_name || '" with ' || NEW.booking_host_name,
              NEW.booking_id::text,
              false,
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
            );
          END LOOP;
          
          -- Notify therapist if therapist_id exists
          IF NEW.therapist_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
            SELECT 
              id,
              'therapist',
              'new_booking',
              'New Booking Assigned',
              'New session "' || NEW.booking_resource_name || '" booked with ' || NEW.invitee_name,
              NEW.booking_id::text,
              false,
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
            FROM users 
            WHERE therapist_id = NEW.therapist_id AND role = 'therapist';
          END IF;
          
        ELSIF (TG_OP = 'UPDATE') THEN
          -- Status changed to cancelled
          IF OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id,
                'admin',
                'booking_cancelled',
                'Booking Cancelled',
                'Session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been cancelled',
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              );
            END LOOP;
            
            -- Notify therapist
            IF NEW.therapist_id IS NOT NULL THEN
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              SELECT 
                id,
                'therapist',
                'booking_cancelled',
                'Session Cancelled',
                'Your session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been cancelled',
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              FROM users 
              WHERE therapist_id = NEW.therapist_id AND role = 'therapist';
            END IF;
          END IF;
          
          -- Status changed to rescheduled
          IF OLD.booking_status != 'rescheduled' AND NEW.booking_status = 'rescheduled' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id,
                'admin',
                'booking_rescheduled',
                'Booking Rescheduled',
                'Session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been rescheduled',
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              );
            END LOOP;
            
            -- Notify therapist
            IF NEW.therapist_id IS NOT NULL THEN
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              SELECT 
                id,
                'therapist',
                'booking_rescheduled',
                'Session Rescheduled',
                'Your session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been rescheduled',
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              FROM users 
              WHERE therapist_id = NEW.therapist_id AND role = 'therapist';
            END IF;
          END IF;
          
          -- Status changed to no_show
          IF OLD.booking_status != 'no_show' AND NEW.booking_status = 'no_show' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id,
                'admin',
                'no_show',
                'Client No-Show',
                NEW.invitee_name || ' did not show up for session "' || NEW.booking_resource_name || '"',
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              );
            END LOOP;
          END IF;
          
          -- Refund status changed to requested
          IF (OLD.refund_status IS NULL OR OLD.refund_status != 'requested') AND NEW.refund_status = 'requested' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id,
                'admin',
                'refund_requested',
                'Refund Requested',
                NEW.invitee_name || ' requested a refund of ₹' || COALESCE(NEW.refund_amount::text, '0'),
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              );
            END LOOP;
          END IF;
          
          -- Refund status changed to completed/processed
          IF (OLD.refund_status IS NULL OR (OLD.refund_status != 'completed' AND OLD.refund_status != 'processed')) 
             AND (NEW.refund_status = 'completed' OR NEW.refund_status = 'processed') THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id,
                'admin',
                'refund_processed',
                'Refund Completed',
                'Refund of ₹' || COALESCE(NEW.refund_amount::text, '0') || ' processed for ' || NEW.invitee_name,
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              );
            END LOOP;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Function created\n');

    // Step 2: Drop existing trigger if exists
    console.log('2. Removing old trigger if exists...');
    await pool.query(`
      DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
    `);
    console.log('✓ Old trigger removed\n');

    // Step 3: Create trigger
    console.log('3. Creating new trigger...');
    await pool.query(`
      CREATE TRIGGER booking_notification_trigger
      AFTER INSERT OR UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION notify_admins_on_booking();
    `);
    console.log('✓ Trigger created\n');

    console.log('=== SUCCESS ===');
    console.log('Automatic notifications are now enabled!');
    console.log('\nNotifications will be created for:');
    console.log('- New bookings (INSERT)');
    console.log('- Cancelled bookings (status → cancelled)');
    console.log('- Rescheduled bookings (status → rescheduled)');
    console.log('- No-show bookings (status → no_show)');
    console.log('- Refund requests (refund_status → requested)');
    console.log('- Refund completed (refund_status → completed/processed)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createBookingNotificationTrigger();
