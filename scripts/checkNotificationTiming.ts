import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Check booking
    const booking = await pool.query(`
      SELECT booking_id, invitee_name, booking_host_name, invitee_created_at
      FROM bookings
      WHERE invitee_name ILIKE '%Shaury%'
      ORDER BY invitee_created_at DESC
      LIMIT 1
    `);
    
    console.log('=== BOOKING INFO ===');
    console.log('Booking ID:', booking.rows[0].booking_id);
    console.log('Client:', booking.rows[0].invitee_name);
    console.log('Therapist:', booking.rows[0].booking_host_name);
    console.log('Created At:', booking.rows[0].invitee_created_at);
    console.log('');
    
    // Check notification
    const notification = await pool.query(`
      SELECT notification_id, title, message, created_at, user_role
      FROM notifications
      WHERE message ILIKE '%Shaury%'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('=== NOTIFICATIONS ===');
    notification.rows.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Created At: ${notif.created_at}`);
      console.log(`   User Role: ${notif.user_role}`);
      
      // Calculate time difference
      const now = new Date();
      const notifDate = new Date(notif.created_at);
      const diffMs = now - notifDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      console.log(`   Time ago: ${diffDays} days (${diffHours} hours)`);
      console.log('');
    });
    
    // Compare dates
    if (booking.rows.length > 0 && notification.rows.length > 0) {
      const bookingDate = new Date(booking.rows[0].invitee_created_at);
      const notifDate = new Date(notification.rows[0].created_at);
      const diff = Math.abs(bookingDate - notifDate);
      const diffMinutes = Math.floor(diff / (1000 * 60));
      
      console.log('=== TIME DIFFERENCE ===');
      console.log(`Booking created: ${bookingDate}`);
      console.log(`Notification created: ${notifDate}`);
      console.log(`Difference: ${diffMinutes} minutes`);
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
