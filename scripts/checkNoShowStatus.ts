import pool from '../api/lib/db.js';

async function checkNoShowStatus() {
  try {
    // Check all distinct booking statuses
    const allStatuses = await pool.query(`
      SELECT DISTINCT booking_status, COUNT(*) as count
      FROM bookings
      GROUP BY booking_status
      ORDER BY count DESC
    `);

    console.log('All Booking Statuses:');
    console.log(allStatuses.rows);

    // Check for no-show variations
    const noShowVariations = await pool.query(`
      SELECT booking_id, invitee_name, booking_status, booking_start_at
      FROM bookings
      WHERE LOWER(booking_status) LIKE '%no%show%' 
         OR LOWER(booking_status) LIKE '%noshow%'
         OR LOWER(booking_status) LIKE '%no_show%'
         OR booking_status = 'no show'
    `);

    console.log('\nNo-Show Bookings:');
    console.log(noShowVariations.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkNoShowStatus();
