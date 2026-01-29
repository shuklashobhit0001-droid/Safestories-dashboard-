import pool from '../lib/db';

async function deepInvestigation() {
  try {
    console.log('\n=== DEEP INVESTIGATION OF ALL STATS ===\n');

    // 1. Check total bookings in DB
    console.log('1. TOTAL BOOKINGS IN DATABASE:\n');
    
    const totalBookings = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') THEN 1 END) as confirmed,
        COUNT(CASE WHEN booking_status IN ('cancelled', 'canceled') THEN 1 END) as cancelled,
        COUNT(CASE WHEN booking_status IN ('no_show', 'no show') THEN 1 END) as no_show
      FROM bookings
    `);
    console.table(totalBookings.rows);

    // 2. Check Dec 2025 bookings
    console.log('\n2. DECEMBER 2025 DETAILED BREAKDOWN:\n');
    
    const decAll = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_status,
        invitee_payment_amount,
        TO_CHAR(booking_start_at, 'YYYY-MM-DD HH24:MI:SS') as booking_date
      FROM bookings
      WHERE booking_start_at >= '2025-12-01'
        AND booking_start_at < '2026-01-01'
      ORDER BY booking_start_at
    `);
    
    console.log(`   Total bookings in Dec 2025: ${decAll.rows.length}`);
    console.table(decAll.rows);

    // 3. Check Jan 2026 bookings
    console.log('\n3. JANUARY 2026 DETAILED BREAKDOWN:\n');
    
    const janAll = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_status,
        invitee_payment_amount,
        TO_CHAR(booking_start_at, 'YYYY-MM-DD HH24:MI:SS') as booking_date
      FROM bookings
      WHERE booking_start_at >= '2026-01-01'
        AND booking_start_at < '2026-02-01'
      ORDER BY booking_start_at
    `);
    
    console.log(`   Total bookings in Jan 2026: ${janAll.rows.length}`);
    
    // Group by status
    const janByStatus = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total_amount
      FROM bookings
      WHERE booking_start_at >= '2026-01-01'
        AND booking_start_at < '2026-02-01'
      GROUP BY booking_status
    `);
    console.table(janByStatus.rows);

    // 4. Test the EXACT query used in API for sessions
    console.log('\n4. TESTING API QUERY FOR SESSIONS:\n');
    
    const decSessions = await pool.query(
      `SELECT COUNT(*) as total FROM bookings 
       WHERE booking_status NOT IN ($1, $2, $3, $4) 
       AND booking_start_at BETWEEN $5 AND $6`,
      ['cancelled', 'canceled', 'no_show', 'no show', '2025-12-01', '2025-12-31 23:59:59']
    );
    console.log(`   Dec 2025 Sessions (API query): ${decSessions.rows[0].total}`);

    const janSessions = await pool.query(
      `SELECT COUNT(*) as total FROM bookings 
       WHERE booking_status NOT IN ($1, $2, $3, $4) 
       AND booking_start_at BETWEEN $5 AND $6`,
      ['cancelled', 'canceled', 'no_show', 'no show', '2026-01-01', '2026-01-31 23:59:59']
    );
    console.log(`   Jan 2026 Sessions (API query): ${janSessions.rows[0].total}`);

    // 5. Check if there's a timezone issue with the date filter
    console.log('\n5. CHECKING DATE FILTER VARIATIONS:\n');
    
    // Using BETWEEN with 23:59:59
    const janBetween = await pool.query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
    `);
    console.log(`   BETWEEN '2026-01-01' AND '2026-01-31 23:59:59': ${janBetween.rows[0].count}`);

    // Using >= and <
    const janRange = await pool.query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE booking_start_at >= '2026-01-01'
        AND booking_start_at < '2026-02-01'
    `);
    console.log(`   >= '2026-01-01' AND < '2026-02-01': ${janRange.rows[0].count}`);

    // Check if any bookings are on the boundary
    const boundary = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        TO_CHAR(booking_start_at, 'YYYY-MM-DD HH24:MI:SS.MS') as exact_time
      FROM bookings
      WHERE booking_start_at >= '2026-01-31 23:59:59'
        AND booking_start_at < '2026-02-01 00:00:01'
    `);
    console.log(`\n   Bookings on Jan 31 boundary: ${boundary.rows.length}`);
    if (boundary.rows.length > 0) {
      console.table(boundary.rows);
    }

    // 6. Calculate what revenue SHOULD be
    console.log('\n6. REVENUE CALCULATION CHECK:\n');
    
    const janRevenue = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN invitee_payment_amount IS NOT NULL AND invitee_payment_amount > 0 THEN 1 END) as paid_bookings,
        COALESCE(SUM(CASE WHEN invitee_payment_amount IS NOT NULL AND invitee_payment_amount > 0 THEN invitee_payment_amount END), 0) as paid_revenue,
        COALESCE(SUM(invitee_payment_amount), 0) as total_revenue
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
    `);
    
    console.log('   Jan 2026:');
    console.table(janRevenue.rows);

    // 7. Check if there are bookings with unusual amounts
    console.log('\n7. CHECKING FOR UNUSUAL PAYMENT AMOUNTS:\n');
    
    const unusualAmounts = await pool.query(`
      SELECT 
        invitee_payment_amount,
        COUNT(*) as count
      FROM bookings
      WHERE booking_start_at >= '2026-01-01'
        AND booking_start_at < '2026-02-01'
      GROUP BY invitee_payment_amount
      ORDER BY invitee_payment_amount
    `);
    console.table(unusualAmounts.rows);

    // 8. Find the missing ₹9,500
    console.log('\n8. FINDING THE MISSING ₹9,500:\n');
    console.log('   Expected: ₹77,700');
    console.log('   Getting: ₹68,200');
    console.log('   Missing: ₹9,500\n');

    // Check if ₹9,500 is exactly some bookings
    const possibleMissing = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_payment_amount,
        booking_status,
        TO_CHAR(booking_start_at, 'YYYY-MM-DD HH24:MI:SS') as booking_date
      FROM bookings
      WHERE booking_start_at >= '2026-01-01'
        AND booking_start_at < '2026-02-01'
        AND booking_status NOT IN ('cancelled', 'canceled')
        AND invitee_payment_amount IS NOT NULL
      ORDER BY invitee_payment_amount DESC
    `);

    let runningTotal = 0;
    let missingBookings = [];
    for (let booking of possibleMissing.rows) {
      runningTotal += parseFloat(booking.invitee_payment_amount);
      if (runningTotal <= 9500) {
        missingBookings.push(booking);
      }
    }

    console.log(`   Bookings that sum to ~₹9,500:`);
    console.table(missingBookings);
    console.log(`   Sum: ₹${missingBookings.reduce((sum, b) => sum + parseFloat(b.invitee_payment_amount), 0).toLocaleString()}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

deepInvestigation();
