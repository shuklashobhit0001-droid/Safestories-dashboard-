import pool from '../lib/db.js';

async function checkBookingsAndNotifications() {
  console.log('=== Checking Bookings & Notification System ===\n');

  try {
    // Check total bookings
    const bookingsResult = await pool.query('SELECT COUNT(*) as total FROM bookings');
    console.log(`Total bookings in database: ${bookingsResult.rows[0].total}\n`);

    // Check recent bookings
    const recentBookings = await pool.query(`
      SELECT booking_id, invitee_name, booking_host_name, booking_status, booking_start_at, invitee_created_at
      FROM bookings
      ORDER BY invitee_created_at DESC
      LIMIT 5
    `);

    console.log('=== Recent 5 Bookings ===');
    recentBookings.rows.forEach((booking, index) => {
      console.log(`${index + 1}. ID: ${booking.booking_id}`);
      console.log(`   Client: ${booking.invitee_name}`);
      console.log(`   Therapist: ${booking.booking_host_name}`);
      console.log(`   Status: ${booking.booking_status}`);
      console.log(`   Created: ${booking.invitee_created_at}\n`);
    });

    // Check if notifications table exists
    const notifTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);
    console.log(`Notifications table exists: ${notifTableCheck.rows[0].exists}\n`);

    // Check all notifications (not just admin)
    const allNotifications = await pool.query('SELECT COUNT(*) as total, user_role FROM notifications GROUP BY user_role');
    console.log('=== Notifications by Role ===');
    if (allNotifications.rows.length === 0) {
      console.log('No notifications found for any role\n');
    } else {
      allNotifications.rows.forEach(row => {
        console.log(`${row.user_role}: ${row.total}`);
      });
    }

    // Check if there's a webhook or trigger that creates notifications
    console.log('\n=== Analysis ===');
    console.log('Bookings are being created, but notifications are NOT being triggered.');
    console.log('\nPossible reasons:');
    console.log('1. Bookings are imported directly into DB (not via API)');
    console.log('2. External booking system (Calendly/etc) creates bookings without calling notification API');
    console.log('3. No webhook configured to trigger notifications on booking creation');
    console.log('4. Bookings created before notification system was implemented\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkBookingsAndNotifications();
