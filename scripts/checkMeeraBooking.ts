import pool from '../lib/db';

async function checkMeeraBooking() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        booking_resource_name,
        booking_start_at,
        booking_end_at,
        invitee_payment_amount,
        invitee_payment_gateway,
        refund_status,
        refund_amount,
        booking_status,
        invitee_cancelled_at
      FROM bookings
      WHERE invitee_name ILIKE '%Meera%'
        AND invitee_phone LIKE '%9579865707%'
      ORDER BY booking_start_at DESC
      LIMIT 5;
    `);

    console.log('\n=== Meera Booking Data ===\n');
    console.log(`Found ${result.rows.length} booking(s)\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`--- Booking ${index + 1} ---`);
      console.log(`Name: ${row.invitee_name}`);
      console.log(`Phone: ${row.invitee_phone}`);
      console.log(`Session: ${row.booking_resource_name}`);
      console.log(`Start: ${row.booking_start_at}`);
      console.log(`End: ${row.booking_end_at}`);
      console.log(`Payment Amount: ${row.invitee_payment_amount}`);
      console.log(`Payment Gateway: ${row.invitee_payment_gateway}`);
      console.log(`Refund Status: ${row.refund_status}`);
      console.log(`Refund Amount: ${row.refund_amount}`);
      console.log(`Booking Status: ${row.booking_status}`);
      console.log(`Cancelled At: ${row.invitee_cancelled_at}`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkMeeraBooking();
