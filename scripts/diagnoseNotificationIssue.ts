import pool from '../lib/db.js';

async function diagnoseNotificationIssue() {
  console.log('=== NOTIFICATION SYSTEM DIAGNOSTIC ===\n');

  try {
    // 1. Check notifications by role
    console.log('1. NOTIFICATIONS BY ROLE:');
    const { rows: notifByRole } = await pool.query(`
      SELECT user_role, COUNT(*) as count 
      FROM notifications 
      GROUP BY user_role
      ORDER BY count DESC
    `);
    console.table(notifByRole);

    // 2. Check recent notifications
    console.log('\n2. RECENT NOTIFICATIONS (Last 5):');
    const { rows: recentNotifs } = await pool.query(`
      SELECT user_role, notification_type, title, created_at 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.table(recentNotifs);

    // 3. Check therapist users
    console.log('\n3. THERAPIST USERS:');
    const { rows: therapists } = await pool.query(`
      SELECT id, username, role, therapist_id 
      FROM users 
      WHERE role = 'therapist'
    `);
    console.table(therapists);

    // 4. Check recent bookings with therapist_id
    console.log('\n4. RECENT BOOKINGS (Last 5):');
    const { rows: bookings } = await pool.query(`
      SELECT booking_id, invitee_name, booking_host_name, therapist_id, booking_status 
      FROM bookings 
      ORDER BY booking_id DESC 
      LIMIT 5
    `);
    console.table(bookings);

    // 5. Check if triggers exist
    console.log('\n5. ACTIVE TRIGGERS:');
    const { rows: triggers } = await pool.query(`
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE event_object_table = 'bookings'
    `);
    console.table(triggers);

    // 6. Cross-check: bookings with therapist_id but no therapist notifications
    console.log('\n6. BOOKINGS WITH THERAPIST_ID BUT MISSING THERAPIST NOTIFICATIONS:');
    const { rows: missing } = await pool.query(`
      SELECT 
        b.booking_id, 
        b.invitee_name, 
        b.therapist_id,
        COUNT(n.notification_id) as therapist_notif_count
      FROM bookings b
      LEFT JOIN notifications n ON n.related_id = b.booking_id::text AND n.user_role = 'therapist'
      WHERE b.therapist_id IS NOT NULL
      GROUP BY b.booking_id, b.invitee_name, b.therapist_id
      HAVING COUNT(n.notification_id) = 0
      ORDER BY b.booking_id DESC
      LIMIT 5
    `);
    console.table(missing);

    // 7. Check if therapist_id in bookings matches users.therapist_id
    console.log('\n7. THERAPIST ID MATCHING:');
    const { rows: matching } = await pool.query(`
      SELECT 
        b.therapist_id as booking_therapist_id,
        COUNT(DISTINCT b.booking_id) as booking_count,
        COUNT(DISTINCT u.id) as matching_user_count
      FROM bookings b
      LEFT JOIN users u ON u.therapist_id = b.therapist_id AND u.role = 'therapist'
      WHERE b.therapist_id IS NOT NULL
      GROUP BY b.therapist_id
    `);
    console.table(matching);

    console.log('\n=== DIAGNOSTIC COMPLETE ===');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseNotificationIssue();
