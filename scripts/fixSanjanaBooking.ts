import pool from '../lib/db';

async function fixSanjanaBooking() {
  try {
    console.log('Fixing Sanjana\'s booking...\n');
    
    // Get current booking data
    const checkQuery = `
      SELECT booking_id, invitee_name, booking_invitee_time, booking_start_at, booking_end_at
      FROM bookings
      WHERE booking_id = '677749';
    `;
    
    const current = await pool.query(checkQuery);
    console.log('Current booking data:');
    console.log(current.rows[0]);
    console.log('\n');
    
    // Update to correct time: 3:30 PM - 4:20 PM IST
    const updateQuery = `
      UPDATE bookings
      SET booking_invitee_time = 'Thursday, Jan 29, 2026 at 3:30 PM - 4:20 PM (GMT+05:30)'
      WHERE booking_id = '677749';
    `;
    
    await pool.query(updateQuery);
    console.log('✓ Updated booking_invitee_time\n');
    
    // Verify the fix
    const verify = await pool.query(checkQuery);
    console.log('Updated booking data:');
    console.log(verify.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixSanjanaBooking();
