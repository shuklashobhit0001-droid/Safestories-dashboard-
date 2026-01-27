import pool from '../lib/db.js';

async function fixNotificationTriggerUserIdCast() {
  console.log('=== Fixing Notification Trigger user_id Type Casting ===\n');

  try {
    console.log('Updating trigger function to cast user_id to TEXT...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION notify_admins_on_booking()
      RETURNS TRIGGER AS $$
      DECLARE
        admin_record RECORD;
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
            INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
            VALUES (
              admin_record.id::TEXT,
              'admin',
              'new_booking',
              'New Booking Created',
              NEW.invitee_name || ' booked "' || NEW.booking_resource_name || '" with ' || NEW.booking_host_name,
              NEW.booking_id::text,
              false,
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
            );
          END LOOP;
          
          IF NEW.therapist_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
            SELECT 
              id::TEXT,
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
          IF OLD.booking_status != 'cancelled' AND NEW.booking_status = 'cancelled' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id::TEXT,
                'admin',
                'booking_cancelled',
                'Booking Cancelled',
                'Session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been cancelled',
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              );
            END LOOP;
            
            IF NEW.therapist_id IS NOT NULL THEN
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              SELECT 
                id::TEXT,
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
          
          IF OLD.booking_status != 'rescheduled' AND NEW.booking_status = 'rescheduled' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id::TEXT,
                'admin',
                'booking_rescheduled',
                'Booking Rescheduled',
                'Session "' || NEW.booking_resource_name || '" with ' || NEW.invitee_name || ' has been rescheduled',
                NEW.booking_id::text,
                false,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
              );
            END LOOP;
            
            IF NEW.therapist_id IS NOT NULL THEN
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              SELECT 
                id::TEXT,
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
          
          IF OLD.booking_status != 'no_show' AND NEW.booking_status = 'no_show' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id::TEXT,
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
          
          IF (OLD.refund_status IS NULL OR OLD.refund_status != 'requested') AND NEW.refund_status = 'requested' THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id::TEXT,
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
          
          IF (OLD.refund_status IS NULL OR (OLD.refund_status != 'completed' AND OLD.refund_status != 'processed')) 
             AND (NEW.refund_status = 'completed' OR NEW.refund_status = 'processed') THEN
            FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
              INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
              VALUES (
                admin_record.id::TEXT,
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

    console.log('✓ Trigger function updated with TEXT casting\n');
    console.log('=== SUCCESS ===');
    console.log('The trigger now casts user_id to TEXT before inserting into notifications table.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixNotificationTriggerUserIdCast();
