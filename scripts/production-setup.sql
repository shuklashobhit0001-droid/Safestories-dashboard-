-- Run this script on your production database to enable automatic notifications

-- 1. Create booking notification function
CREATE OR REPLACE FUNCTION notify_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  therapist_user_id TEXT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- NEW BOOKING: Notify all admins
    FOR admin_record IN SELECT id FROM users WHERE role = 'admin' LOOP
      INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
      VALUES (
        admin_record.id, 'admin', 'new_booking', 'New Booking Created',
        NEW.invitee_name || ' booked "' || NEW.booking_resource_name || '" with ' || NEW.booking_host_name,
        NEW.booking_id::text
      );
    END LOOP;
    
    -- NEW BOOKING: Notify therapist
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
    -- CANCELLED
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
    
    -- RESCHEDULED
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
    
    -- NO SHOW
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
    
    -- REFUND REQUESTED
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
    
    -- REFUND COMPLETED
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

-- 2. Create client transfer notification function
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

-- 3. Create session notes notification function
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

-- 4. Drop existing triggers
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
DROP TRIGGER IF EXISTS transfer_notification_trigger ON client_transfer_history;
DROP TRIGGER IF EXISTS session_notes_notification_trigger ON client_session_notes;

-- 5. Create triggers
CREATE TRIGGER booking_notification_trigger
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_on_booking();

CREATE TRIGGER transfer_notification_trigger
AFTER INSERT ON client_transfer_history
FOR EACH ROW
EXECUTE FUNCTION notify_on_client_transfer();

CREATE TRIGGER session_notes_notification_trigger
AFTER INSERT ON client_session_notes
FOR EACH ROW
EXECUTE FUNCTION notify_on_session_notes();
