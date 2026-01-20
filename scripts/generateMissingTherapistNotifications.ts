import pool from '../lib/db.js';

async function generateMissingTherapistNotifications() {
  console.log('=== GENERATING MISSING THERAPIST NOTIFICATIONS ===\n');

  try {
    // Find bookings with therapist_id but no therapist notifications
    const { rows: bookings } = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.booking_resource_name,
        b.therapist_id,
        u.id as user_id
      FROM bookings b
      INNER JOIN users u ON u.therapist_id = b.therapist_id AND u.role = 'therapist'
      LEFT JOIN notifications n ON n.related_id = b.booking_id::text AND n.user_role = 'therapist'
      WHERE b.therapist_id IS NOT NULL
        AND n.notification_id IS NULL
    `);

    console.log(`Found ${bookings.length} bookings missing therapist notifications\n`);

    if (bookings.length === 0) {
      console.log('✅ All bookings already have therapist notifications!');
      return;
    }

    let created = 0;

    for (const booking of bookings) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')`,
        [
          booking.user_id,
          'therapist',
          'new_booking',
          'New Booking Assigned',
          `New session "${booking.booking_resource_name}" booked with ${booking.invitee_name}`,
          booking.booking_id
        ]
      );
      created++;
      console.log(`✓ Created notification for booking ${booking.booking_id} (${booking.invitee_name})`);
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Created ${created} therapist notifications`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

generateMissingTherapistNotifications();
