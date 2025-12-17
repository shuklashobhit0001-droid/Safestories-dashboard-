import pool from '../lib/db';

async function checkBookingStatuses() {
  try {
    const statuses = await pool.query(`
      SELECT DISTINCT booking_status, COUNT(*) as count
      FROM bookings
      GROUP BY booking_status;
    `);
    
    console.log('Booking statuses in database:');
    statuses.rows.forEach(row => {
      console.log(`- ${row.booking_status}: ${row.count} bookings`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookingStatuses();
