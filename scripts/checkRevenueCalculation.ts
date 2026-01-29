import pool from '../lib/db';

async function checkRevenueCalculation() {
  try {
    console.log('\n=== REVENUE CALCULATION ANALYSIS ===\n');

    // Jan 2026 - Only paid bookings
    const janPaid = await pool.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND invitee_payment_amount IS NOT NULL
        AND invitee_payment_amount > 0
        AND booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
    `);

    console.log('JAN 2026 - PAID BOOKINGS ONLY:');
    console.log(`   Count: ${janPaid.rows[0].count}`);
    console.log(`   Total: ₹${parseFloat(janPaid.rows[0].total).toLocaleString()}\n`);

    // Jan 2026 - Including NULL (which becomes 0)
    const janAll = await pool.query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
    `);

    console.log('JAN 2026 - ALL CONFIRMED (INCLUDING NULL):');
    console.log(`   Count: ${janAll.rows[0].count}`);
    console.log(`   Total: ₹${parseFloat(janAll.rows[0].total).toLocaleString()}\n`);

    // Check if there's a difference
    const difference = parseFloat(janAll.rows[0].total) - parseFloat(janPaid.rows[0].total);
    console.log(`Difference: ₹${difference.toLocaleString()}`);
    console.log(`(This should be 0 if NULL values are handled correctly)\n`);

    // Show breakdown by payment amount
    const breakdown = await pool.query(`
      SELECT 
        CASE 
          WHEN invitee_payment_amount IS NULL THEN 'NULL'
          WHEN invitee_payment_amount = 0 THEN 'ZERO'
          ELSE 'PAID'
        END as payment_type,
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
      GROUP BY 
        CASE 
          WHEN invitee_payment_amount IS NULL THEN 'NULL'
          WHEN invitee_payment_amount = 0 THEN 'ZERO'
          ELSE 'PAID'
        END
    `);

    console.log('JAN 2026 BREAKDOWN:');
    console.table(breakdown.rows);

    // Check what the actual API endpoint would return
    console.log('\n=== SIMULATING API RESPONSE ===\n');
    
    const apiQuery = `
      SELECT COALESCE(SUM(invitee_payment_amount), 0) as total 
      FROM bookings 
      WHERE booking_status NOT IN ($1, $2) 
      AND booking_start_at BETWEEN $3 AND $4
    `;
    
    const apiResult = await pool.query(apiQuery, ['cancelled', 'canceled', '2026-01-01', '2026-01-31 23:59:59']);
    console.log(`API would return: ₹${parseFloat(apiResult.rows[0].total).toLocaleString()}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkRevenueCalculation();
