import pool from '../lib/db';

async function checkBookingStatuses() {
  try {
    // Check distinct booking statuses
    const statusResult = await pool.query(`
      SELECT booking_status, COUNT(*) as count
      FROM bookings 
      GROUP BY booking_status
      ORDER BY count DESC
    `);
    
    console.log('\n=== BOOKING STATUSES ===');
    console.table(statusResult.rows);
    
    // Check if there are any cancelled bookings with different status values
    const cancelledResult = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_status,
        invitee_cancelled_at,
        booking_cancelled_by
      FROM bookings 
      WHERE invitee_cancelled_at IS NOT NULL 
         OR booking_cancelled_by IS NOT NULL
      ORDER BY invitee_cancelled_at DESC
      LIMIT 20
    `);
    
    console.log('\n=== BOOKINGS WITH CANCELLATION DATA ===');
    console.log(`Total: ${cancelledResult.rows.length}\n`);
    if (cancelledResult.rows.length > 0) {
      console.table(cancelledResult.rows);
    } else {
      console.log('No bookings with cancellation data found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkBookingStatuses();
