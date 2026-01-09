import pool from '../lib/db.js';
import { notifyTherapist } from '../lib/notifications.js';

async function notifyExistingBookings() {
  try {
    // Get all future bookings that haven't been notified
    const result = await pool.query(`
      SELECT b.booking_id, b.invitee_name, b.booking_resource_name, 
             b.booking_host_name, t.therapist_id, b.booking_start_at
      FROM bookings b
      LEFT JOIN therapists t ON b.booking_host_name ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
      WHERE b.booking_start_at > NOW()
        AND b.booking_status != 'cancelled'
        AND NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE notification_type = 'new_booking' 
          AND related_id = b.booking_id::text
          AND user_role = 'therapist'
        )
      ORDER BY b.booking_start_at ASC
    `);

    console.log(`Found ${result.rows.length} bookings to notify`);

    for (const booking of result.rows) {
      if (booking.therapist_id) {
        await notifyTherapist(
          booking.therapist_id,
          'new_booking',
          'New Booking Assigned',
          `Session "${booking.booking_resource_name}" with ${booking.invitee_name}`,
          booking.booking_id
        );
        console.log(`✓ Notified therapist for booking ${booking.booking_id} - ${booking.invitee_name}`);
      } else {
        console.log(`⚠ No therapist found for booking ${booking.booking_id} - ${booking.booking_host_name}`);
      }
    }

    console.log('Done!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

notifyExistingBookings();
