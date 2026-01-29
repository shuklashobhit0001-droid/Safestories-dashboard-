import pool from '../lib/db';

async function testCurrentAPIResponse() {
  try {
    console.log('\n=== TESTING CURRENT API RESPONSE ===\n');

    // Simulate Dec 2025 API call
    console.log('1. DECEMBER 2025 API RESPONSE:\n');
    
    const decRevenue = await pool.query(
      'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', '2025-12-01', '2025-12-31 23:59:59']
    );

    const decSessions = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status NOT IN ($1, $2, $3, $4) AND booking_start_at BETWEEN $5 AND $6',
      ['cancelled', 'canceled', 'no_show', 'no show', '2025-12-01', '2025-12-31 23:59:59']
    );

    const decFreeConsultations = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
      ['2025-12-01', '2025-12-31 23:59:59']
    );

    const decCancelled = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', '2025-12-01', '2025-12-31 23:59:59']
    );

    const decRefunds = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
      ['2025-12-01', '2025-12-31 23:59:59']
    );

    const decRefundedAmount = await pool.query(
      'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
      ['2025-12-01', '2025-12-31 23:59:59']
    );

    const decNoShows = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['no_show', 'no show', '2025-12-01', '2025-12-31 23:59:59']
    );

    console.log('   Revenue: ₹' + parseFloat(decRevenue.rows[0].total).toLocaleString());
    console.log('   Refunded Amount: ₹' + parseFloat(decRefundedAmount.rows[0].total).toLocaleString());
    console.log('   Sessions: ' + decSessions.rows[0].total);
    console.log('   Free Consultations: ' + decFreeConsultations.rows[0].total);
    console.log('   Cancelled: ' + decCancelled.rows[0].total);
    console.log('   Refunds: ' + decRefunds.rows[0].total);
    console.log('   No-shows: ' + decNoShows.rows[0].total);

    // Simulate Jan 2026 API call
    console.log('\n2. JANUARY 2026 API RESPONSE:\n');
    
    const janRevenue = await pool.query(
      'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', '2026-01-01', '2026-01-31 23:59:59']
    );

    const janSessions = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status NOT IN ($1, $2, $3, $4) AND booking_start_at BETWEEN $5 AND $6',
      ['cancelled', 'canceled', 'no_show', 'no show', '2026-01-01', '2026-01-31 23:59:59']
    );

    const janFreeConsultations = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
      ['2026-01-01', '2026-01-31 23:59:59']
    );

    const janCancelled = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', '2026-01-01', '2026-01-31 23:59:59']
    );

    const janRefunds = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
      ['2026-01-01', '2026-01-31 23:59:59']
    );

    const janRefundedAmount = await pool.query(
      'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
      ['2026-01-01', '2026-01-31 23:59:59']
    );

    const janNoShows = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['no_show', 'no show', '2026-01-01', '2026-01-31 23:59:59']
    );

    console.log('   Revenue: ₹' + parseFloat(janRevenue.rows[0].total).toLocaleString());
    console.log('   Refunded Amount: ₹' + parseFloat(janRefundedAmount.rows[0].total).toLocaleString());
    console.log('   Sessions: ' + janSessions.rows[0].total);
    console.log('   Free Consultations: ' + janFreeConsultations.rows[0].total);
    console.log('   Cancelled: ' + janCancelled.rows[0].total);
    console.log('   Refunds: ' + janRefunds.rows[0].total);
    console.log('   No-shows: ' + janNoShows.rows[0].total);

    // Show what SHOULD be returned after fix
    console.log('\n3. AFTER FIX (Excluding Free Consultations from Revenue):\n');
    
    const decRevenueFixed = await pool.query(
      'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND invitee_payment_amount IS NOT NULL AND invitee_payment_amount > 0 AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', '2025-12-01', '2025-12-31 23:59:59']
    );

    const janRevenueFixed = await pool.query(
      'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND invitee_payment_amount IS NOT NULL AND invitee_payment_amount > 0 AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', '2026-01-01', '2026-01-31 23:59:59']
    );

    console.log('   Dec 2025 Revenue (Fixed): ₹' + parseFloat(decRevenueFixed.rows[0].total).toLocaleString());
    console.log('   Jan 2026 Revenue (Fixed): ₹' + parseFloat(janRevenueFixed.rows[0].total).toLocaleString());

    console.log('\n4. COMPARISON:\n');
    console.log('   Dec 2025:');
    console.log('     Current: ₹' + parseFloat(decRevenue.rows[0].total).toLocaleString());
    console.log('     After Fix: ₹' + parseFloat(decRevenueFixed.rows[0].total).toLocaleString());
    console.log('     Difference: ₹' + (parseFloat(decRevenue.rows[0].total) - parseFloat(decRevenueFixed.rows[0].total)).toLocaleString());
    
    console.log('\n   Jan 2026:');
    console.log('     Current: ₹' + parseFloat(janRevenue.rows[0].total).toLocaleString());
    console.log('     After Fix: ₹' + parseFloat(janRevenueFixed.rows[0].total).toLocaleString());
    console.log('     Difference: ₹' + (parseFloat(janRevenue.rows[0].total) - parseFloat(janRevenueFixed.rows[0].total)).toLocaleString());

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testCurrentAPIResponse();
