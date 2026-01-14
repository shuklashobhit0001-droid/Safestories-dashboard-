import pool from '../lib/db.js';

async function notifyAllTherapists() {
  try {
    // Get all therapist users
    const usersResult = await pool.query(
      "SELECT id, username, therapist_id FROM users WHERE role = 'therapist'"
    );

    console.log(`Found ${usersResult.rows.length} therapists`);

    for (const user of usersResult.rows) {
      // Get therapist name
      const therapistResult = await pool.query(
        'SELECT name FROM therapists WHERE therapist_id = $1',
        [user.therapist_id]
      );

      if (therapistResult.rows.length === 0) continue;

      const therapistName = therapistResult.rows[0].name;
      const therapistFirstName = therapistName.split(' ')[0];

      // Get bookings without notifications
      const bookingsResult = await pool.query(`
        SELECT b.booking_id, b.invitee_name, b.booking_resource_name
        FROM bookings b
        WHERE b.booking_host_name ILIKE $1
          AND NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE notification_type = 'new_booking' 
            AND related_id = b.booking_id::text
            AND user_id = $2
          )
      `, [`%${therapistFirstName}%`, user.id.toString()]);

      console.log(`\n${user.username}: ${bookingsResult.rows.length} bookings without notifications`);

      for (const booking of bookingsResult.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            user.id.toString(),
            'therapist',
            'new_booking',
            'New Booking Assigned',
            `New session "${booking.booking_resource_name}" booked with ${booking.invitee_name}`,
            booking.booking_id
          ]
        );
        console.log(`  ✓ Created notification for booking ${booking.booking_id}`);
      }
    }

    console.log('\nDone!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

notifyAllTherapists();
