import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_host_name,
        booking_resource_name,
        booking_invitee_time,
        invitee_created_at,
        booking_start_at
      FROM bookings
      WHERE invitee_created_at >= $1
      ORDER BY invitee_created_at DESC
    `, [twoDaysAgo.toISOString()]);
    
    console.log('=== BOOKINGS CREATED IN LAST 2 DAYS ===');
    console.log('Total:', result.rows.length);
    console.log('');
    
    result.rows.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`   Client: ${booking.invitee_name}`);
      console.log(`   Therapist: ${booking.booking_host_name}`);
      console.log(`   Session: ${booking.booking_resource_name}`);
      console.log(`   Session Time: ${booking.booking_invitee_time}`);
      console.log(`   Created At: ${booking.invitee_created_at}`);
      console.log('');
    });
    
    // Group by therapist
    const therapistCount = new Map();
    result.rows.forEach(booking => {
      const therapist = booking.booking_host_name;
      therapistCount.set(therapist, (therapistCount.get(therapist) || 0) + 1);
    });
    
    console.log('=== BOOKINGS BY THERAPIST ===');
    therapistCount.forEach((count, therapist) => {
      console.log(`${therapist}: ${count} booking(s)`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
