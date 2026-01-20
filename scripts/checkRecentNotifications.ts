import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Get recent bookings (last 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const bookings = await pool.query(`
      SELECT booking_id, invitee_name, booking_host_name, invitee_created_at
      FROM bookings
      WHERE invitee_created_at >= $1
      ORDER BY invitee_created_at DESC
    `, [twoDaysAgo.toISOString()]);
    
    console.log('=== RECENT BOOKINGS (Last 2 days) ===');
    console.log('Total:', bookings.rows.length);
    console.log('');
    
    for (const booking of bookings.rows) {
      console.log(`Booking ID: ${booking.booking_id}`);
      console.log(`Client: ${booking.invitee_name}`);
      console.log(`Therapist: ${booking.booking_host_name}`);
      console.log(`Created: ${booking.invitee_created_at}`);
      
      // Check if notification exists for this booking
      const notifications = await pool.query(`
        SELECT notification_id, title, message, created_at, user_role, related_id
        FROM notifications
        WHERE related_id = $1
        ORDER BY created_at DESC
      `, [booking.booking_id]);
      
      if (notifications.rows.length > 0) {
        console.log(`✅ Notifications: ${notifications.rows.length} found`);
        notifications.rows.forEach(notif => {
          console.log(`   - ${notif.title} (${notif.user_role}) - ${notif.created_at}`);
        });
      } else {
        console.log(`❌ NO NOTIFICATIONS FOUND for this booking!`);
      }
      console.log('');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
