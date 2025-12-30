import pool from '../lib/db';

async function debugDecBookings() {
  try {
    console.log('\n=== CHECKING DEC 2025 BOOKINGS ===\n');
    
    const result = await pool.query(`
      SELECT 
        booking_id,
        booking_host_name, 
        booking_host_user_id, 
        booking_status, 
        booking_start_at,
        invitee_name
      FROM bookings 
      WHERE booking_start_at BETWEEN '2025-12-01' AND '2025-12-31 23:59:59'
      AND booking_status IN ('confirmed', 'rescheduled')
      ORDER BY booking_start_at
    `);

    console.log(`Total bookings in Dec 2025: ${result.rows.length}\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`Booking ${index + 1}:`);
      console.log(`  ID: ${row.booking_id}`);
      console.log(`  Client: ${row.invitee_name}`);
      console.log(`  Therapist Name: ${row.booking_host_name}`);
      console.log(`  Therapist User ID: ${row.booking_host_user_id}`);
      console.log(`  Status: ${row.booking_status}`);
      console.log(`  Date: ${row.booking_start_at}`);
      console.log('');
    });

    // Check what therapist names match "Ishika"
    const ishikaResult = await pool.query(`
      SELECT 
        booking_host_name,
        COUNT(*) as count
      FROM bookings 
      WHERE booking_start_at BETWEEN '2025-12-01' AND '2025-12-31 23:59:59'
      AND booking_status IN ('confirmed', 'rescheduled')
      AND booking_host_name ILIKE '%Ishika%'
      GROUP BY booking_host_name
    `);

    console.log('=== BOOKINGS MATCHING "Ishika" ===\n');
    console.log(`Total matching Ishika: ${ishikaResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)}\n`);
    ishikaResult.rows.forEach(row => {
      console.log(`  ${row.booking_host_name}: ${row.count} booking(s)`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugDecBookings();
