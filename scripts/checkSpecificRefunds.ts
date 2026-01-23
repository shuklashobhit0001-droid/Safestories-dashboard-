import pool from '../lib/db';

async function checkSpecificRefunds() {
  try {
    const result = await pool.query(`
      SELECT 
        r.client_name,
        b.invitee_phone,
        r.session_name,
        r.session_timings,
        r.refund_status,
        b.booking_id,
        b.booking_status
      FROM refund_cancellation_table r
      LEFT JOIN bookings b ON r.session_id = b.booking_id
      WHERE b.invitee_phone = '+919876543210'
        AND r.session_name LIKE '%Free Consultation%'
      ORDER BY r.session_timings DESC
    `);

    console.log('\n=== Refund Records for +919876543210 ===\n');
    console.log(`Found ${result.rows.length} records:\n`);
    
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. Client: ${row.client_name}`);
      console.log(`   Phone: ${row.invitee_phone}`);
      console.log(`   Session: ${row.session_name}`);
      console.log(`   Date/Time: ${row.session_timings}`);
      console.log(`   Refund Status: ${row.refund_status}`);
      console.log(`   Booking ID: ${row.booking_id}`);
      console.log(`   Booking Status: ${row.booking_status}\n`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkSpecificRefunds();
