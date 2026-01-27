import pool from '../lib/db';

async function verifyDashboardData() {
  try {
    console.log('=== VERIFYING DASHBOARD STATS & APPOINTMENTS ===\n');

    // 1. APPOINTMENTS TABLE - Check what's displayed
    console.log('1. APPOINTMENTS API (/api/appointments)');
    console.log('Query: bookings WHERE booking_start_at >= NOW() - INTERVAL \'1 day\'\n');
    
    const appointmentsAPI = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_invitee_time,
        b.booking_resource_name,
        b.invitee_name,
        b.invitee_phone,
        b.invitee_email,
        b.booking_host_name,
        b.booking_mode,
        b.booking_start_at,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE b.booking_start_at >= NOW() - INTERVAL '1 day'
      ORDER BY b.booking_start_at ASC
    `);
    
    console.log(`Total appointments returned by API: ${appointmentsAPI.rows.length}\n`);

    // 2. DASHBOARD STATS - Revenue
    console.log('2. DASHBOARD STATS - REVENUE');
    console.log('Query: SUM(invitee_payment_amount) WHERE booking_status NOT IN (\'cancelled\', \'canceled\')\n');
    
    const revenueAPI = await pool.query(
      'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2)',
      ['cancelled', 'canceled']
    );
    console.log(`Revenue from API: ₹${revenueAPI.rows[0].total}\n`);

    // 3. DASHBOARD STATS - Sessions
    console.log('3. DASHBOARD STATS - SESSIONS');
    console.log('Query: COUNT(*) WHERE booking_status NOT IN (\'cancelled\', \'canceled\', \'no_show\', \'no show\')\n');
    
    const sessionsAPI = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status NOT IN ($1, $2, $3, $4)',
      ['cancelled', 'canceled', 'no_show', 'no show']
    );
    console.log(`Sessions from API: ${sessionsAPI.rows[0].total}\n`);

    // 4. DASHBOARD STATS - Free Consultations
    console.log('4. DASHBOARD STATS - FREE CONSULTATIONS');
    console.log('Query: COUNT(*) WHERE invitee_payment_amount = 0 OR invitee_payment_amount IS NULL\n');
    
    const freeAPI = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)'
    );
    console.log(`Free Consultations from API: ${freeAPI.rows[0].total}\n`);

    // 5. DASHBOARD STATS - Cancelled
    console.log('5. DASHBOARD STATS - CANCELLED');
    console.log('Query: COUNT(*) WHERE booking_status IN (\'cancelled\', \'canceled\')\n');
    
    const cancelledAPI = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)',
      ['cancelled', 'canceled']
    );
    console.log(`Cancelled from API: ${cancelledAPI.rows[0].total}\n`);

    // 6. DASHBOARD STATS - Refunds
    console.log('6. DASHBOARD STATS - REFUNDS');
    console.log('Query: COUNT(*) WHERE refund_status IS NOT NULL\n');
    
    const refundsAPI = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL'
    );
    console.log(`Refunds from API: ${refundsAPI.rows[0].total}\n`);

    // 7. DASHBOARD STATS - Refunded Amount
    console.log('7. DASHBOARD STATS - REFUNDED AMOUNT');
    console.log('Query: SUM(refund_amount) WHERE refund_status IS NOT NULL\n');
    
    const refundedAmountAPI = await pool.query(
      'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL'
    );
    console.log(`Refunded Amount from API: ₹${refundedAmountAPI.rows[0].total}\n`);

    // 8. DASHBOARD STATS - No Shows
    console.log('8. DASHBOARD STATS - NO SHOWS');
    console.log('Query: COUNT(*) WHERE booking_status IN (\'no_show\', \'no show\')\n');
    
    const noShowsAPI = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)',
      ['no_show', 'no show']
    );
    console.log(`No Shows from API: ${noShowsAPI.rows[0].total}\n`);

    // 9. LIVE SESSIONS COUNT
    console.log('9. LIVE SESSIONS COUNT');
    console.log('Query: COUNT(*) WHERE booking_status NOT IN (\'cancelled\', \'canceled\', \'no_show\') AND booking_start_at <= NOW() AND booking_start_at + INTERVAL \'50 minutes\' >= NOW()\n');
    
    const liveAPI = await pool.query(`
      SELECT COUNT(*) as live_count
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND booking_start_at <= NOW()
        AND booking_start_at + INTERVAL '50 minutes' >= NOW()
    `);
    console.log(`Live Sessions from API: ${liveAPI.rows[0].live_count}\n`);

    // 10. ACTUAL DATABASE COUNTS
    console.log('=== ACTUAL DATABASE VERIFICATION ===\n');
    
    const allBookings = await pool.query('SELECT COUNT(*) as total FROM bookings');
    console.log(`Total bookings in DB: ${allBookings.rows[0].total}`);

    const statusBreakdown = await pool.query(`
      SELECT booking_status, COUNT(*) as count 
      FROM bookings 
      GROUP BY booking_status 
      ORDER BY count DESC
    `);
    console.log('\nBooking Status Breakdown:');
    statusBreakdown.rows.forEach(row => {
      console.log(`  ${row.booking_status || 'NULL'}: ${row.count}`);
    });

    const refundStatusBreakdown = await pool.query(`
      SELECT refund_status, COUNT(*) as count 
      FROM bookings 
      WHERE refund_status IS NOT NULL
      GROUP BY refund_status 
      ORDER BY count DESC
    `);
    console.log('\nRefund Status Breakdown:');
    refundStatusBreakdown.rows.forEach(row => {
      console.log(`  ${row.refund_status}: ${row.count}`);
    });

    const paymentBreakdown = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE invitee_payment_amount > 0) as paid,
        COUNT(*) FILTER (WHERE invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) as free,
        SUM(invitee_payment_amount) as total_revenue
      FROM bookings
    `);
    console.log('\nPayment Breakdown:');
    console.log(`  Paid bookings: ${paymentBreakdown.rows[0].paid}`);
    console.log(`  Free bookings: ${paymentBreakdown.rows[0].free}`);
    console.log(`  Total revenue: ₹${paymentBreakdown.rows[0].total_revenue}`);

    const timeBreakdown = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE booking_start_at >= NOW() - INTERVAL '1 day') as last_24h,
        COUNT(*) FILTER (WHERE booking_start_at >= NOW()) as upcoming,
        COUNT(*) FILTER (WHERE booking_start_at < NOW()) as past
      FROM bookings
    `);
    console.log('\nTime Breakdown:');
    console.log(`  Last 24 hours: ${timeBreakdown.rows[0].last_24h}`);
    console.log(`  Upcoming: ${timeBreakdown.rows[0].upcoming}`);
    console.log(`  Past: ${timeBreakdown.rows[0].past}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyDashboardData();
