import pool from '../api/lib/db.js';

async function getDetailedStats() {
  try {
    console.log('📊 Fetching Detailed Statistics...\n');

    // Overall Stats
    const totalBookings = await pool.query(`SELECT COUNT(*) as count FROM bookings`);
    
    const cancelledBookings = await pool.query(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE booking_status = 'cancelled' OR booking_status = 'canceled'
    `);
    
    const noShowBookings = await pool.query(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE booking_status = 'no show'
    `);
    
    const freeConsultations = await pool.query(`
      SELECT COUNT(*) as count FROM bookings
      WHERE booking_subject LIKE '%Free Consultation%'
    `);
    
    const totalRevenue = await pool.query(`
      SELECT 
        SUM(invitee_payment_amount) as total_revenue,
        SUM(CASE WHEN refund_amount IS NOT NULL THEN refund_amount ELSE 0 END) as total_refunds,
        SUM(invitee_payment_amount) - SUM(CASE WHEN refund_amount IS NOT NULL THEN refund_amount ELSE 0 END) as net_revenue
      FROM bookings 
      WHERE invitee_payment_amount IS NOT NULL
    `);

    // Month-wise Stats for Dec 2025, Jan 2026, Feb 2026
    const monthWiseStats = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN booking_status = 'cancelled' OR booking_status = 'canceled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN booking_status = 'no show' THEN 1 END) as no_show,
        SUM(invitee_payment_amount) as revenue,
        SUM(CASE WHEN refund_amount IS NOT NULL THEN refund_amount ELSE 0 END) as refunds,
        SUM(invitee_payment_amount) - SUM(CASE WHEN refund_amount IS NOT NULL THEN refund_amount ELSE 0 END) as net_revenue
      FROM bookings 
      WHERE booking_start_at >= '2025-12-01' AND booking_start_at < '2026-03-01'
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM')
      ORDER BY month
    `);

    // Free Consultations Month-wise
    const freeConsultationsMonthly = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        COUNT(*) as free_consultations,
        COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN booking_status = 'no show' THEN 1 END) as no_show
      FROM bookings
      WHERE booking_subject LIKE '%Free Consultation%'
        AND booking_start_at >= '2025-12-01' AND booking_start_at < '2026-03-01'
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM')
      ORDER BY month
    `);

    // Print Results
    console.log('═══════════════════════════════════════════════════════');
    console.log('                  OVERALL STATISTICS                   ');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`📅 Total Bookings: ${totalBookings.rows[0].count}`);
    console.log(`❌ Cancelled/Canceled: ${cancelledBookings.rows[0].count}`);
    console.log(`🚫 No-Show: ${noShowBookings.rows[0].count}`);
    console.log(`🆓 Free Consultations: ${freeConsultations.rows[0].count}`);
    console.log(`\n💰 Revenue:`);
    console.log(`   Total Revenue: ₹${parseFloat(totalRevenue.rows[0].total_revenue || 0).toFixed(2)}`);
    console.log(`   Total Refunds: ₹${parseFloat(totalRevenue.rows[0].total_refunds || 0).toFixed(2)}`);
    console.log(`   Net Revenue (Excluding Refunds): ₹${parseFloat(totalRevenue.rows[0].net_revenue || 0).toFixed(2)}`);

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('              MONTH-WISE STATISTICS                    ');
    console.log('═══════════════════════════════════════════════════════\n');

    monthWiseStats.rows.forEach(row => {
      const monthName = row.month === '2025-12' ? 'December 2025' : 
                        row.month === '2026-01' ? 'January 2026' : 
                        row.month === '2026-02' ? 'February 2026' : row.month;
      
      console.log(`\n📆 ${monthName}`);
      console.log(`   Total Bookings: ${row.total_bookings}`);
      console.log(`   Cancelled: ${row.cancelled}`);
      console.log(`   No-Show: ${row.no_show}`);
      console.log(`   Revenue: ₹${parseFloat(row.revenue || 0).toFixed(2)}`);
      console.log(`   Refunds: ₹${parseFloat(row.refunds || 0).toFixed(2)}`);
      console.log(`   Net Revenue: ₹${parseFloat(row.net_revenue || 0).toFixed(2)}`);
    });

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('         FREE CONSULTATIONS (MONTH-WISE)              ');
    console.log('═══════════════════════════════════════════════════════\n');

    freeConsultationsMonthly.rows.forEach(row => {
      const monthName = row.month === '2025-12' ? 'December 2025' : 
                        row.month === '2026-01' ? 'January 2026' : 
                        row.month === '2026-02' ? 'February 2026' : row.month;
      console.log(`   ${monthName}: ${row.free_consultations} sessions (Confirmed: ${row.confirmed}, Cancelled: ${row.cancelled}, No-Show: ${row.no_show})`);
    });

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
  } finally {
    await pool.end();
  }
}

getDetailedStats();
