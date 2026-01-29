import pool from '../lib/db';

async function checkFeb2026() {
  try {
    console.log('\n=== FEBRUARY 2026 DETAILED CHECK ===\n');
    
    const feb = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_status,
        invitee_payment_amount,
        TO_CHAR(booking_start_at, 'YYYY-MM-DD HH24:MI:SS') as booking_date
      FROM bookings
      WHERE booking_start_at >= '2026-02-01'
        AND booking_start_at < '2026-03-01'
      ORDER BY booking_start_at
    `);
    
    console.log(`Total Feb 2026 bookings: ${feb.rows.length}\n`);
    console.table(feb.rows);
    
    // Summary
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') THEN 1 END) as confirmed,
        COALESCE(SUM(CASE WHEN booking_status NOT IN ('cancelled', 'canceled') THEN invitee_payment_amount END), 0) as revenue,
        COALESCE(SUM(refund_amount), 0) as refunded
      FROM bookings
      WHERE booking_start_at >= '2026-02-01'
        AND booking_start_at < '2026-03-01'
    `);
    
    console.log('\n=== FEB 2026 SUMMARY ===\n');
    console.table(summary.rows);
    
    // Now check ALL TIME
    console.log('\n=== ALL TIME TOTALS ===\n');
    
    const allTime = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') THEN 1 END) as confirmed_sessions,
        COALESCE(SUM(CASE WHEN booking_status NOT IN ('cancelled', 'canceled') THEN invitee_payment_amount END), 0) as total_revenue,
        COALESCE(SUM(refund_amount), 0) as total_refunded
      FROM bookings
    `);
    
    console.table(allTime.rows);
    
    // Verify the math
    console.log('\n=== VERIFICATION ===\n');
    console.log('Dec 2025: ₹1,700');
    console.log('Jan 2026: ₹77,700');
    console.log('Feb 2026: ₹' + summary.rows[0].revenue);
    console.log('Total: ₹' + (1700 + 77700 + parseFloat(summary.rows[0].revenue)));
    console.log('Expected (All Time): ₹' + allTime.rows[0].total_revenue);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkFeb2026();
