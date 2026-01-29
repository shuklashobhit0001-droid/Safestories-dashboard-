import pool from '../lib/db';

async function checkAllMonths() {
  try {
    console.log('\n=== ALL BOOKINGS BY MONTH ===\n');
    
    const result = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        booking_status,
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as revenue
      FROM bookings
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM'), booking_status
      ORDER BY month, booking_status
    `);
    
    console.table(result.rows);
    
    // Summary by month
    const summary = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') THEN 1 END) as confirmed,
        COALESCE(SUM(CASE WHEN booking_status NOT IN ('cancelled', 'canceled') THEN invitee_payment_amount END), 0) as revenue
      FROM bookings
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM')
      ORDER BY month
    `);
    
    console.log('\n=== SUMMARY BY MONTH ===\n');
    console.table(summary.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAllMonths();
