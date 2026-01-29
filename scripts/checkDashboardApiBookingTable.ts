import pool from '../lib/db';

async function checkDashboardApiBooking() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_resource_name,
        start_at,
        end_at,
        payment_status,
        payment_amount,
        created_at
      FROM dashboard_api_booking 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n=== DASHBOARD_API_BOOKING TABLE ===`);
    console.log(`Total Records: ${result.rows.length}\n`);
    console.table(result.rows);
    
    // Check status breakdown
    const statusResult = await pool.query(`
      SELECT payment_status, COUNT(*) as count
      FROM dashboard_api_booking
      GROUP BY payment_status
    `);
    
    console.log('\n=== PAYMENT STATUS BREAKDOWN ===');
    console.table(statusResult.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDashboardApiBooking();
