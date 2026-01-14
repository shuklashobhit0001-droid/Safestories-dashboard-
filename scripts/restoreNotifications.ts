import pool from '../lib/db.js';

async function restoreNotificationsForRecentBookings() {
  console.log('=== Restoring Notifications for Recent Bookings ===\n');

  try {
    // Get all admins
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    console.log(`Found ${admins.rows.length} admin(s)\n`);

    // Get 5 most recent bookings
    const recentBookings = await pool.query(`
      SELECT booking_id, invitee_name, booking_resource_name, booking_host_name, therapist_id, invitee_created_at
      FROM bookings
      ORDER BY invitee_created_at DESC
      LIMIT 5
    `);

    console.log(`Found ${recentBookings.rows.length} recent bookings\n`);

    let notificationCount = 0;

    for (const booking of recentBookings.rows) {
      console.log(`Creating notifications for booking ${booking.booking_id}...`);
      
      // Create admin notifications
      for (const admin of admins.rows) {
        await pool.query(`
          INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          admin.id,
          'admin',
          'new_booking',
          'New Booking Created',
          `${booking.invitee_name} booked "${booking.booking_resource_name}" with ${booking.booking_host_name}`,
          booking.booking_id.toString()
        ]);
        notificationCount++;
      }

      // Create therapist notification if therapist_id exists
      if (booking.therapist_id) {
        const therapistUser = await pool.query(
          "SELECT id FROM users WHERE therapist_id = $1 AND role = 'therapist' LIMIT 1",
          [booking.therapist_id]
        );

        if (therapistUser.rows.length > 0) {
          await pool.query(`
            INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            therapistUser.rows[0].id,
            'therapist',
            'new_booking',
            'New Booking Assigned',
            `New session "${booking.booking_resource_name}" booked with ${booking.invitee_name}`,
            booking.booking_id.toString()
          ]);
          notificationCount++;
        }
      }

      console.log(`✓ Notifications created for booking ${booking.booking_id}\n`);
    }

    console.log('=== ✅ SUCCESS ===');
    console.log(`Total notifications created: ${notificationCount}`);
    console.log(`\nRefresh your admin dashboard to see the notifications!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

restoreNotificationsForRecentBookings();
