import pool from '../lib/db';

async function verifyDashboardStats() {
  try {
    console.log('🔍 Verifying Dashboard Stats from Database...\n');

    // Revenue
    const revenue = await pool.query(`
      SELECT COALESCE(SUM(invitee_payment_amount), 0) as total 
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
    `);
    console.log('💰 Revenue:', `₹${Number(revenue.rows[0].total).toLocaleString()}`);

    // Refunded Amount
    const refundedAmount = await pool.query(`
      SELECT COALESCE(SUM(refund_amount), 0) as total 
      FROM bookings 
      WHERE refund_status IS NOT NULL
    `);
    console.log('💸 Refunded:', `₹${Number(refundedAmount.rows[0].total).toLocaleString()}`);

    // Sessions (FIXED)
    const sessions = await pool.query(`
      SELECT COUNT(*) as total 
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);
    console.log('📅 Sessions:', sessions.rows[0].total);

    // Free Consultations
    const freeConsultations = await pool.query(`
      SELECT COUNT(*) as total 
      FROM bookings 
      WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)
    `);
    console.log('🆓 Free Consultations:', freeConsultations.rows[0].total);

    // Cancelled
    const cancelled = await pool.query(`
      SELECT COUNT(*) as total 
      FROM bookings 
      WHERE booking_status IN ('cancelled', 'canceled')
    `);
    console.log('❌ Cancelled:', cancelled.rows[0].total);

    // Refunds Count
    const refunds = await pool.query(`
      SELECT COUNT(*) as total 
      FROM bookings 
      WHERE refund_status IS NOT NULL
    `);
    console.log('🔄 Refunds:', refunds.rows[0].total);

    // No-shows
    const noShows = await pool.query(`
      SELECT COUNT(*) as total 
      FROM bookings 
      WHERE booking_status IN ('no_show', 'no show')
    `);
    console.log('👻 No-shows:', noShows.rows[0].total);

    console.log('\n📊 All Booking Statuses:');
    const allStatuses = await pool.query(`
      SELECT booking_status, COUNT(*) as count 
      FROM bookings 
      GROUP BY booking_status 
      ORDER BY count DESC
    `);
    allStatuses.rows.forEach(row => {
      console.log(`   ${row.booking_status || 'NULL'}: ${row.count}`);
    });

    console.log('\n🔢 Total Bookings:', await pool.query('SELECT COUNT(*) as total FROM bookings').then(r => r.rows[0].total));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyDashboardStats();
