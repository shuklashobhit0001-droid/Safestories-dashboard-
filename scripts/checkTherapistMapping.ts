import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Check recent bookings and their therapist mapping
    const bookings = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.booking_host_name,
        t.therapist_id,
        t.name as therapist_full_name,
        u.id as user_id,
        u.username
      FROM bookings b
      LEFT JOIN therapists t ON b.booking_host_name ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
      LEFT JOIN users u ON u.therapist_id = t.therapist_id AND u.role = 'therapist'
      WHERE b.booking_id IN ('671567', '671481', '671287')
      ORDER BY b.booking_id DESC
    `);
    
    console.log('=== THERAPIST MAPPING CHECK ===\n');
    
    bookings.rows.forEach(booking => {
      console.log(`Booking ID: ${booking.booking_id}`);
      console.log(`Client: ${booking.invitee_name}`);
      console.log(`Booking Host Name: "${booking.booking_host_name}"`);
      console.log(`Matched Therapist ID: ${booking.therapist_id || 'NULL'}`);
      console.log(`Matched Therapist Name: ${booking.therapist_full_name || 'NULL'}`);
      console.log(`Matched User ID: ${booking.user_id || 'NULL'}`);
      console.log(`Matched Username: ${booking.username || 'NULL'}`);
      
      if (!booking.user_id) {
        console.log('❌ NO USER_ID - Therapist notification will NOT be created!');
      } else {
        console.log('✅ User ID found - Notification should be created');
      }
      console.log('');
    });
    
    // Check all therapists
    console.log('=== ALL THERAPISTS IN DATABASE ===\n');
    const therapists = await pool.query('SELECT therapist_id, name FROM therapists ORDER BY name');
    therapists.rows.forEach(t => {
      console.log(`${t.therapist_id}: ${t.name}`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
