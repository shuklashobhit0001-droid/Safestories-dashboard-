import pool from '../lib/db';

async function identifyMonthFilterIssue() {
  try {
    console.log('\n=== IDENTIFYING MONTH FILTER ISSUE ===\n');

    // 1. Test the exact query used in dashboard API for Dec 2025
    console.log('1. DECEMBER 2025 FILTER TEST:\n');
    
    const decQuery = `SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4`;
    const decParams = ['cancelled', 'canceled', '2025-12-01', '2025-12-31 23:59:59'];
    
    const decResult = await pool.query(decQuery, decParams);
    console.log(`   Query: ${decQuery}`);
    console.log(`   Params: ${JSON.stringify(decParams)}`);
    console.log(`   Result: ₹${parseFloat(decResult.rows[0].total).toLocaleString()}\n`);

    // Show what bookings are included
    const decBookings = await pool.query(`
      SELECT booking_id, invitee_name, invitee_payment_amount, booking_status, booking_start_at
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled') 
      AND booking_start_at BETWEEN '2025-12-01' AND '2025-12-31 23:59:59'
    `);
    console.log('   Bookings included:');
    console.table(decBookings.rows);

    // 2. Test the exact query used in dashboard API for Jan 2026
    console.log('\n2. JANUARY 2026 FILTER TEST:\n');
    
    const janQuery = `SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4`;
    const janParams = ['cancelled', 'canceled', '2026-01-01', '2026-01-31 23:59:59'];
    
    const janResult = await pool.query(janQuery, janParams);
    console.log(`   Query: ${janQuery}`);
    console.log(`   Params: ${JSON.stringify(janParams)}`);
    console.log(`   Result: ₹${parseFloat(janResult.rows[0].total).toLocaleString()}\n`);

    // Count bookings by payment type
    const janBreakdown = await pool.query(`
      SELECT 
        CASE 
          WHEN invitee_payment_amount IS NULL THEN 'NULL (Free)'
          WHEN invitee_payment_amount = 0 THEN 'ZERO (Free)'
          ELSE 'PAID'
        END as type,
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled') 
      AND booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
      GROUP BY 
        CASE 
          WHEN invitee_payment_amount IS NULL THEN 'NULL (Free)'
          WHEN invitee_payment_amount = 0 THEN 'ZERO (Free)'
          ELSE 'PAID'
        END
    `);
    console.log('   Jan 2026 Breakdown:');
    console.table(janBreakdown.rows);

    // 3. Check if there's a timezone issue
    console.log('\n3. TIMEZONE CHECK:\n');
    
    const timezoneTest = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_start_at,
        booking_start_at AT TIME ZONE 'UTC' as utc_time,
        booking_start_at AT TIME ZONE 'Asia/Kolkata' as ist_time
      FROM bookings 
      WHERE booking_start_at >= '2025-12-01' 
      AND booking_start_at < '2026-02-01'
      ORDER BY booking_start_at
      LIMIT 5
    `);
    console.table(timezoneTest.rows);

    // 4. Test with different date formats
    console.log('\n4. DATE FORMAT COMPARISON:\n');
    
    // Format 1: YYYY-MM-DD with time
    const format1 = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
      AND booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
    `);
    console.log(`   Format 1 (BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'):`);
    console.log(`   Count: ${format1.rows[0].count}, Total: ₹${parseFloat(format1.rows[0].total).toLocaleString()}`);

    // Format 2: Using >= and <
    const format2 = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
      AND booking_start_at >= '2026-01-01'
      AND booking_start_at < '2026-02-01'
    `);
    console.log(`   Format 2 (>= '2026-01-01' AND < '2026-02-01'):`);
    console.log(`   Count: ${format2.rows[0].count}, Total: ₹${parseFloat(format2.rows[0].total).toLocaleString()}`);

    // 5. Check what production might be seeing (with refund column)
    console.log('\n5. CHECKING REFUND COLUMN IMPACT:\n');
    
    const withRefundCheck = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN refund_amount IS NOT NULL THEN 1 END) as with_refund,
        COALESCE(SUM(invitee_payment_amount), 0) as revenue,
        COALESCE(SUM(refund_amount), 0) as refunds
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
      AND booking_start_at >= '2025-12-01'
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM')
      ORDER BY month
    `);
    console.table(withRefundCheck.rows);

    console.log('\n=== ISSUE SUMMARY ===\n');
    console.log('✓ No date filter: ₹81,100 (Correct - matches both Vercel and Local)');
    console.log('✓ Database query: Dec ₹1,700, Jan ₹77,700 (Correct)');
    console.log('✗ Vercel shows: Dec ₹3,400, Jan ₹58,400 (WRONG)');
    console.log('✗ Local shows: Dec ₹1,700, Jan ₹68,200 (PARTIALLY WRONG)\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

identifyMonthFilterIssue();
