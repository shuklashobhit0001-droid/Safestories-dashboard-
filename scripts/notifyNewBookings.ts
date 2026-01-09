import pool from '../lib/db.js';
import { notifyAllAdmins, notifyTherapist } from '../lib/notifications.js';

async function notifyNewBookings() {
  try {
    // Get bookings created in last 5 minutes that haven't been notified
    const result = await pool.query(`
      SELECT b.booking_id, b.invitee_name, b.booking_resource_name, 
             b.booking_host_name, t.therapist_id
      FROM bookings b
      LEFT JOIN therapists t ON b.booking_host_name ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
      WHERE b.invitee_created_at > NOW() - INTERVAL '5 minutes'
        AND NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE notification_type = 'new_booking' 
          AND related_id = b.booking_id::text
        )
    `);

    for (const booking of result.rows) {
      // Notify therapist
      if (booking.therapist_id) {
        await notifyTherapist(
          booking.therapist_id,
          'new_booking',
          'New Booking Assigned',
          `New session "${booking.booking_resource_name}" booked with ${booking.invitee_name}`,
          booking.booking_id
        );
      }

      // Notify admins
      await notifyAllAdmins(
        'new_booking',
        'New Booking Created',
        `${booking.invitee_name} booked "${booking.booking_resource_name}" with ${booking.booking_host_name}`,
        booking.booking_id
      );

      console.log(`✓ Notified for booking ${booking.booking_id}`);
    }

    console.log(`Processed ${result.rows.length} new bookings`);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

notifyNewBookings();
