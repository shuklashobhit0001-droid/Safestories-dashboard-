import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Check all bookings for Ishika
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_resource_name,
        booking_invitee_time,
        booking_status,
        booking_start_at
      FROM bookings
      WHERE booking_host_name ILIKE '%Ishika%'
      ORDER BY booking_start_at DESC
    `);
    
    console.log('Total bookings for Ishika:', result.rows.length);
    console.log('\n=== ALL BOOKINGS ===');
    result.rows.forEach(row => {
      console.log(`\nBooking ID: ${row.booking_id}`);
      console.log(`Client: ${row.invitee_name}`);
      console.log(`Session: ${row.booking_resource_name}`);
      console.log(`Status: ${row.booking_status}`);
      console.log(`Time: ${row.booking_invitee_time}`);
    });
    
    // Check cancelled bookings specifically
    const cancelled = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_resource_name,
        booking_invitee_time,
        booking_status
      FROM bookings
      WHERE booking_host_name ILIKE '%Ishika%'
        AND booking_status IN ('cancelled', 'canceled')
      ORDER BY booking_start_at DESC
    `);
    
    console.log('\n\n=== CANCELLED BOOKINGS ===');
    console.log('Total cancelled:', cancelled.rows.length);
    cancelled.rows.forEach(row => {
      console.log(`\nBooking ID: ${row.booking_id}`);
      console.log(`Client: ${row.invitee_name}`);
      console.log(`Session: ${row.booking_resource_name}`);
      console.log(`Status: ${row.booking_status}`);
      console.log(`Time: ${row.booking_invitee_time}`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
