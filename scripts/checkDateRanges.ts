import pool from '../api/lib/db.js';

async function checkDateRanges() {
  try {
    const dateRange = await pool.query(`
      SELECT 
        MIN(booking_start_at) as earliest_booking,
        MAX(booking_start_at) as latest_booking,
        COUNT(*) as total_count
      FROM bookings 
      WHERE booking_start_at IS NOT NULL
    `);

    console.log('Date Range in Database:');
    console.log(dateRange.rows[0]);

    const allMonths = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM bookings 
      WHERE booking_start_at IS NOT NULL
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM')
      ORDER BY month DESC
    `);

    console.log('\nAll Months with Bookings:');
    console.log(allMonths.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDateRanges();
