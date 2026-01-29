import pool from '../lib/db';

async function testMonthFilter() {
  try {
    console.log('\n=== TESTING MONTH FILTER LOGIC ===\n');

    // Test Dec 2025 filter (as used in API)
    const dec2025API = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_payment_amount,
        booking_status,
        booking_start_at
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND booking_start_at BETWEEN '2025-12-01' AND '2025-12-31 23:59:59'
    `);
    
    const dec2025Total = dec2025API.rows.reduce((sum, row) => sum + (parseFloat(row.invitee_payment_amount) || 0), 0);

    console.log('1. DEC 2025 (API Filter: BETWEEN 2025-12-01 AND 2025-12-31 23:59:59):');
    console.log(`   Revenue: ₹${dec2025Total.toLocaleString()}`);
    console.log(`   Count: ${dec2025API.rows.length}`);
    console.table(dec2025API.rows);

    // Test Jan 2026 filter (as used in API)
    const jan2026API = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_payment_amount,
        booking_status,
        booking_start_at
      FROM bookings 
      WHERE booking_status NOT IN ('cancelled', 'canceled')
        AND booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
    `);
    
    const jan2026Total = jan2026API.rows.reduce((sum, row) => sum + (parseFloat(row.invitee_payment_amount) || 0), 0);

    console.log('\n2. JAN 2026 (API Filter: BETWEEN 2026-01-01 AND 2026-01-31 23:59:59):');
    console.log(`   Revenue: ₹${jan2026Total.toLocaleString()}`);
    console.log(`   Count: ${jan2026API.rows.length}`);
    console.table(jan2026API.rows);

    // Check what the dashboard API query actually returns
    console.log('\n3. CHECKING ACTUAL DASHBOARD API QUERY:');
    
    // Simulate Dec 2025 dashboard query
    const decDashboard = await pool.query(
      `SELECT COALESCE(SUM(invitee_payment_amount), 0) as total 
       FROM bookings 
       WHERE booking_status NOT IN ($1, $2) 
       AND booking_start_at BETWEEN $3 AND $4`,
      ['cancelled', 'canceled', '2025-12-01', '2025-12-31 23:59:59']
    );

    console.log(`   Dec 2025 Dashboard: ₹${parseFloat(decDashboard.rows[0].total).toLocaleString()}`);

    // Simulate Jan 2026 dashboard query
    const janDashboard = await pool.query(
      `SELECT COALESCE(SUM(invitee_payment_amount), 0) as total 
       FROM bookings 
       WHERE booking_status NOT IN ($1, $2) 
       AND booking_start_at BETWEEN $3 AND $4`,
      ['cancelled', 'canceled', '2026-01-01', '2026-01-31 23:59:59']
    );

    console.log(`   Jan 2026 Dashboard: ₹${parseFloat(janDashboard.rows[0].total).toLocaleString()}`);

    // Check all bookings in date range (including cancelled)
    console.log('\n4. ALL BOOKINGS (INCLUDING CANCELLED):');
    
    const allDec = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_start_at BETWEEN '2025-12-01' AND '2025-12-31 23:59:59'
      GROUP BY booking_status
    `);
    
    console.log('\n   Dec 2025 All:');
    console.table(allDec.rows);

    const allJan = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count,
        COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_start_at BETWEEN '2026-01-01' AND '2026-01-31 23:59:59'
      GROUP BY booking_status
    `);
    
    console.log('\n   Jan 2026 All:');
    console.table(allJan.rows);

    // Check if there are bookings with NULL or 0 amounts
    console.log('\n5. CHECKING FOR FREE CONSULTATIONS IN DATE RANGE:');
    
    const freeConsultations = await pool.query(`
      SELECT 
        TO_CHAR(booking_start_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM bookings 
      WHERE (invitee_payment_amount IS NULL OR invitee_payment_amount = 0)
        AND booking_start_at >= '2025-12-01'
      GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM')
      ORDER BY month
    `);
    
    console.table(freeConsultations.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testMonthFilter();
