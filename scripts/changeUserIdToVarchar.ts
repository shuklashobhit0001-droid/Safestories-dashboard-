import pool from '../lib/db.js';

async function changeUserIdToVarchar() {
  try {
    console.log('=== Changing notifications.user_id to VARCHAR(50) ===\n');
    
    console.log('1. Dropping FK constraint...');
    await pool.query(`
      ALTER TABLE notifications 
      DROP CONSTRAINT IF EXISTS fk_notifications_user;
    `);
    console.log('✓ FK dropped\n');
    
    console.log('2. Altering user_id to VARCHAR(50)...');
    await pool.query(`
      ALTER TABLE notifications 
      ALTER COLUMN user_id TYPE VARCHAR(50);
    `);
    console.log('✓ Column altered to VARCHAR(50)\n');
    
    console.log('3. Updating trigger to cast user_id to TEXT...');
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
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✓ Trigger updated\n');
    
    console.log('=== SUCCESS ===');
    console.log('user_id is now VARCHAR(50)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

changeUserIdToVarchar();
