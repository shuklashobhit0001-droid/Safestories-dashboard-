const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function testLiveSessions() {
  try {
    console.log('=== TESTING LIVE SESSIONS ===\n');
    console.log('Current IST Time:', new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium'
    }));
    
    // Test 1: Live Sessions Count
    console.log('\n--- Test 1: Live Sessions Count ---');
    const countResult = await pool.query(`
      SELECT COUNT(*) as live_count
      FROM bookings
      WHERE booking_status = 'active'
        AND booking_start_at <= NOW()
        AND booking_end_at >= NOW()
    `);
    console.log('Live Sessions Count:', countResult.rows[0].live_count);
    
    // Test 2: Therapists Live Status
    console.log('\n--- Test 2: Therapists Live Status ---');
    const therapistsResult = await pool.query(`
      SELECT 
        t.therapist_id,
        t.name,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.therapist_id = t.therapist_id
              AND b.booking_status = 'active'
              AND b.booking_start_at <= NOW()
              AND b.booking_end_at >= NOW()
          ) THEN true
          ELSE false
        END as is_live
      FROM therapists t
      WHERE t.name IN ('Ishika Mahajan', 'Anjali Pillai')
    `);
    
    therapistsResult.rows.forEach(row => {
      console.log(`${row.name}: ${row.is_live ? '🟢 LIVE' : '⚫ Offline'}`);
    });
    
    // Test 3: Current Active Bookings Details
    console.log('\n--- Test 3: Active Bookings Details ---');
    const activeBookings = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        t.name as therapist_name,
        b.booking_start_at,
        b.booking_end_at
      FROM bookings b
      JOIN therapists t ON b.therapist_id = t.therapist_id
      WHERE b.booking_status = 'active'
        AND b.booking_start_at <= NOW()
        AND b.booking_end_at >= NOW()
    `);
    
    if (activeBookings.rows.length === 0) {
      console.log('No active sessions right now');
    } else {
      activeBookings.rows.forEach(row => {
        const start = new Date(row.booking_start_at).toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          timeStyle: 'short'
        });
        const end = new Date(row.booking_end_at).toLocaleString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          timeStyle: 'short'
        });
        console.log(`Booking ${row.booking_id}: ${row.therapist_name} with ${row.invitee_name} (${start} - ${end})`);
      });
    }
    
    console.log('\n=== TEST COMPLETE ===');
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testLiveSessions();
