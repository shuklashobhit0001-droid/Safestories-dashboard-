import pool from '../lib/db.js';

async function testAutomaticNotifications() {
  console.log('=== Testing Automatic Notifications ===\n');

  try {
    // Get admin and therapist IDs
    const adminResult = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const therapistResult = await pool.query("SELECT therapist_id FROM therapists LIMIT 1");
    
    if (adminResult.rows.length === 0) {
      console.log('❌ No admin found');
      return;
    }
    
    if (therapistResult.rows.length === 0) {
      console.log('❌ No therapist found');
      return;
    }

    const therapistId = therapistResult.rows[0].therapist_id;
    
    console.log('1. Creating test booking...');
    const testBooking = await pool.query(`
      INSERT INTO bookings (
        booking_id, invitee_name, invitee_email, invitee_phone,
        booking_resource_name, booking_host_name, booking_mode,
        booking_status, therapist_id, booking_start_at, invitee_created_at
      ) VALUES (
        999999, 'Test Client', 'test@example.com', '+919999999999',
        'Test Session', 'Test Therapist', 'google_meet',
        'confirmed', $1, NOW() + INTERVAL '1 day', NOW()
      ) RETURNING booking_id
    `, [therapistId]);
    
    console.log(`✓ Test booking created: ${testBooking.rows[0].booking_id}\n`);

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check notifications
    console.log('2. Checking notifications created...\n');
    
    const adminNotifs = await pool.query(`
      SELECT notification_type, title, message 
      FROM notifications 
      WHERE user_role = 'admin' AND related_id = '999999'
    `);
    
    const therapistNotifs = await pool.query(`
      SELECT notification_type, title, message 
      FROM notifications 
      WHERE user_role = 'therapist' AND related_id = '999999'
    `);

    console.log(`Admin notifications: ${adminNotifs.rows.length}`);
    adminNotifs.rows.forEach(n => {
      console.log(`  - [${n.notification_type}] ${n.title}`);
      console.log(`    ${n.message}\n`);
    });

    console.log(`Therapist notifications: ${therapistNotifs.rows.length}`);
    therapistNotifs.rows.forEach(n => {
      console.log(`  - [${n.notification_type}] ${n.title}`);
      console.log(`    ${n.message}\n`);
    });

    // Cleanup
    console.log('3. Cleaning up test data...');
    await pool.query("DELETE FROM notifications WHERE related_id = '999999'");
    await pool.query("DELETE FROM bookings WHERE booking_id = 999999");
    console.log('✓ Test data cleaned up\n');

    if (adminNotifs.rows.length > 0 && therapistNotifs.rows.length > 0) {
      console.log('=== ✅ SUCCESS ===');
      console.log('Automatic notifications are working correctly!');
    } else {
      console.log('=== ⚠️ WARNING ===');
      console.log('Notifications were not created. Check trigger setup.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testAutomaticNotifications();
