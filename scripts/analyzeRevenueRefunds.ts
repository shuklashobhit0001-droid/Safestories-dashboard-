import pool from '../lib/db';

async function analyzeRevenueAndRefunds() {
  try {
    // 1. Total Revenue (all bookings)
    const totalRevenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(invitee_payment_amount), 0) as total_revenue,
        COUNT(*) as total_bookings
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND invitee_payment_amount IS NOT NULL
        AND invitee_payment_amount > 0
    `);

    // 2. Total Refund Amount
    const totalRefundResult = await pool.query(`
      SELECT 
        COALESCE(SUM(refund_amount), 0) as total_refund,
        COUNT(*) as refund_count
      FROM bookings 
      WHERE refund_amount IS NOT NULL
        AND refund_amount > 0
    `);

    // 3. Revenue including cancelled bookings (to check if refunds are excluded)
    const revenueWithCancelledResult = await pool.query(`
      SELECT 
        COALESCE(SUM(invitee_payment_amount), 0) as revenue_with_cancelled
      FROM bookings 
      WHERE invitee_payment_amount IS NOT NULL
        AND invitee_payment_amount > 0
    `);

    // 4. December 2025 Revenue
    const dec2025Result = await pool.query(`
      SELECT 
        COALESCE(SUM(invitee_payment_amount), 0) as revenue,
        COUNT(*) as booking_count
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND invitee_payment_amount IS NOT NULL
        AND invitee_payment_amount > 0
        AND booking_start_at >= '2025-12-01'
        AND booking_start_at < '2026-01-01'
    `);

    // 5. January 2026 Revenue
    const jan2026Result = await pool.query(`
      SELECT 
        COALESCE(SUM(invitee_payment_amount), 0) as revenue,
        COUNT(*) as booking_count
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND invitee_payment_amount IS NOT NULL
        AND invitee_payment_amount > 0
        AND booking_start_at >= '2026-01-01'
        AND booking_start_at < '2026-02-01'
    `);

    // 6. Detailed breakdown
    const detailedResult = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        booking_status,
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total_amount,
        COALESCE(SUM(refund_amount), 0) as total_refund
      FROM bookings 
      WHERE invitee_payment_amount IS NOT NULL
        AND invitee_payment_amount > 0
        AND booking_start_at >= '2025-12-01'
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM'), booking_status
      ORDER BY month, booking_status
    `);

    console.log('\n=== REVENUE & REFUND ANALYSIS ===\n');
    
    console.log('1. TOTAL REVENUE (Excluding Cancelled):');
    console.log(`   Amount: ₹${parseFloat(totalRevenueResult.rows[0].total_revenue).toLocaleString()}`);
    console.log(`   Bookings: ${totalRevenueResult.rows[0].total_bookings}\n`);

    console.log('2. TOTAL REFUNDS:');
    console.log(`   Amount: ₹${parseFloat(totalRefundResult.rows[0].total_refund).toLocaleString()}`);
    console.log(`   Count: ${totalRefundResult.rows[0].refund_count}\n`);

    console.log('3. REVENUE INCLUDING CANCELLED:');
    console.log(`   Amount: ₹${parseFloat(revenueWithCancelledResult.rows[0].revenue_with_cancelled).toLocaleString()}\n`);

    const revenueExcluded = parseFloat(totalRevenueResult.rows[0].total_revenue);
    const revenueIncluded = parseFloat(revenueWithCancelledResult.rows[0].revenue_with_cancelled);
    const difference = revenueIncluded - revenueExcluded;

    console.log('4. REFUND EXCLUSION CHECK:');
    console.log(`   Revenue (Excl. Cancelled): ₹${revenueExcluded.toLocaleString()}`);
    console.log(`   Revenue (Incl. Cancelled): ₹${revenueIncluded.toLocaleString()}`);
    console.log(`   Difference: ₹${difference.toLocaleString()}`);
    console.log(`   ✓ Refunds ARE ${difference > 0 ? 'EXCLUDED' : 'NOT EXCLUDED'} from revenue\n`);

    console.log('5. DECEMBER 2025 REVENUE:');
    console.log(`   Amount: ₹${parseFloat(dec2025Result.rows[0].revenue).toLocaleString()}`);
    console.log(`   Bookings: ${dec2025Result.rows[0].booking_count}\n`);

    console.log('6. JANUARY 2026 REVENUE:');
    console.log(`   Amount: ₹${parseFloat(jan2026Result.rows[0].revenue).toLocaleString()}`);
    console.log(`   Bookings: ${jan2026Result.rows[0].booking_count}\n`);

    console.log('7. DETAILED MONTHLY BREAKDOWN:\n');
    console.table(detailedResult.rows);

    console.log('\n=== NET REVENUE CALCULATION ===');
    console.log(`Total Revenue: ₹${revenueExcluded.toLocaleString()}`);
    console.log(`Total Refunds: ₹${parseFloat(totalRefundResult.rows[0].total_refund).toLocaleString()}`);
    console.log(`Net Revenue: ₹${(revenueExcluded - parseFloat(totalRefundResult.rows[0].total_refund)).toLocaleString()}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

analyzeRevenueAndRefunds();
