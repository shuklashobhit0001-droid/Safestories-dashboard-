import pool from '../lib/db.js';

async function notifyIshikaBooking() {
  try {
    // Get Ishika's user ID
    const userResult = await pool.query(
      "SELECT id, therapist_id FROM users WHERE username = 'Ishika' AND role = 'therapist'"
    );

    if (userResult.rows.length === 0) {
      console.log('Ishika user not found');
      await pool.end();
      return;
    }

    const ishikaUserId = userResult.rows[0].id;
    const ishikaTherapistId = userResult.rows[0].therapist_id;

    // Get Ishika's bookings that don't have notifications
    const bookingsResult = await pool.query(`
      SELECT b.booking_id, b.invitee_name, b.booking_resource_name
      FROM bookings b
      WHERE b.booking_host_name ILIKE '%Ishika%'
        AND NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE notification_type = 'new_booking' 
          AND related_id = b.booking_id::text
          AND user_id = $1
        )
    `, [ishikaUserId]);

    console.log(`Found ${bookingsResult.rows.length} bookings without notifications`);

    for (const booking of bookingsResult.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          ishikaUserId,
          'therapist',
          'new_booking',
          'New Booking Assigned',
          `New session "${booking.booking_resource_name}" booked with ${booking.invitee_name}`,
          booking.booking_id
        ]
      );
      console.log(`✓ Created notification for booking ${booking.booking_id}`);
    }

    console.log('Done!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

notifyIshikaBooking();
