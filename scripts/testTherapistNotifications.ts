import pool from '../lib/db.js';
import { notifyTherapist } from '../lib/notifications.js';

async function testTherapistNotifications() {
  console.log('=== Testing Therapist Notifications ===\n');

  try {
    // Get a test therapist
    const therapistResult = await pool.query("SELECT therapist_id, name FROM therapists LIMIT 1");
    if (therapistResult.rows.length === 0) {
      console.log('❌ No therapists found in database');
      return;
    }

    const testTherapist = therapistResult.rows[0];
    const therapistId = testTherapist.therapist_id;
    const therapistName = testTherapist.name;

    console.log(`Using test therapist: ${therapistName} (ID: ${therapistId})\n`);

    // Get therapist user_id for verification
    const userResult = await pool.query("SELECT id FROM users WHERE therapist_id = $1 AND role = 'therapist'", [therapistId]);
    const userId = userResult.rows[0]?.id;

    if (!userId) {
      console.log('❌ No user account found for this therapist');
      return;
    }

    // Clear existing test notifications
    await pool.query("DELETE FROM notifications WHERE user_id = $1 AND message LIKE '%[TEST]%'", [userId]);

    // Test 1: New Booking Assigned
    console.log('1. Testing: New Booking Assigned');
    await notifyTherapist(
      therapistId,
      'new_booking',
      'New Booking Assigned',
      '[TEST] New session "Individual Therapy" booked with Test Client',
      'test-booking-1'
    );
    console.log('✓ Notification created\n');

    // Test 2: Booking Cancelled
    console.log('2. Testing: Booking Cancelled');
    await notifyTherapist(
      therapistId,
      'booking_cancelled',
      'Session Cancelled',
      '[TEST] Your session "Couples Therapy" with Test Client has been cancelled',
      'test-booking-2'
    );
    console.log('✓ Notification created\n');

    // Test 3: Booking Rescheduled
    console.log('3. Testing: Booking Rescheduled');
    await notifyTherapist(
      therapistId,
      'booking_rescheduled',
      'Session Rescheduled',
      '[TEST] Your session "Family Therapy" with Test Client has been rescheduled',
      'test-booking-3'
    );
    console.log('✓ Notification created\n');

    // Test 4: Client Transfer In
    console.log('4. Testing: Client Transfer In');
    await notifyTherapist(
      therapistId,
      'client_transfer_in',
      'New Client Assigned',
      '[TEST] Client Test Client has been transferred to you from Dr. Previous Therapist',
      'test-client-1'
    );
    console.log('✓ Notification created\n');

    // Test 5: Client Transfer Out
    console.log('5. Testing: Client Transfer Out');
    await notifyTherapist(
      therapistId,
      'client_transfer_out',
      'Client Transferred',
      '[TEST] Client Test Client has been transferred to Dr. New Therapist',
      'test-client-2'
    );
    console.log('✓ Notification created\n');

    // Verify all notifications were created
    console.log('=== Verification ===\n');
    const verifyResult = await pool.query(
      "SELECT notification_type, title, message, is_read, created_at FROM notifications WHERE user_id = $1 AND message LIKE '%[TEST]%' ORDER BY created_at DESC",
      [userId]
    );

    console.log(`Total test notifications created: ${verifyResult.rows.length}\n`);

    if (verifyResult.rows.length === 5) {
      console.log('✅ All 5 notifications created successfully!\n');
      verifyResult.rows.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.notification_type}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.is_read}`);
        console.log(`   Created: ${notif.created_at}\n`);
      });
    } else {
      console.log(`❌ Expected 5 notifications, but found ${verifyResult.rows.length}`);
    }

    // Cleanup
    console.log('=== Cleanup ===');
    await pool.query("DELETE FROM notifications WHERE user_id = $1 AND message LIKE '%[TEST]%'", [userId]);
    console.log('✓ Test notifications cleaned up\n');

    console.log('=== Test Complete ===');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await pool.end();
  }
}

testTherapistNotifications();
