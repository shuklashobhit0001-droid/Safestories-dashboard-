import pool from '../lib/db';

async function fixMeeraRefund() {
  try {
    // Check if entry exists in refund_cancellation_table
    const checkRefund = await pool.query(`
      SELECT * FROM refund_cancellation_table 
      WHERE client_name ILIKE '%Meera%' 
      AND session_timings::date = '2026-02-04'
    `);

    console.log('\n=== Refund Cancellation Table Check ===');
    console.log(`Found ${checkRefund.rows.length} entry/entries\n`);

    // Update refund_amount in bookings table
    const updateResult = await pool.query(`
      UPDATE bookings 
      SET refund_amount = 1700.00
      WHERE invitee_name = 'Meera' 
        AND invitee_phone = '+91 9579865707'
        AND booking_start_at::date = '2026-02-04'
        AND refund_amount = 170000.00
      RETURNING booking_id, invitee_name, refund_amount;
    `);

    console.log('=== Updated Bookings Table ===');
    console.log(`Updated ${updateResult.rowCount} row(s)`);
    if (updateResult.rows.length > 0) {
      console.log(`Booking ID: ${updateResult.rows[0].booking_id}`);
      console.log(`Name: ${updateResult.rows[0].invitee_name}`);
      console.log(`New Refund Amount: ₹${updateResult.rows[0].refund_amount}\n`);
    }

    // If entry doesn't exist in refund_cancellation_table, trigger sync
    if (checkRefund.rows.length === 0) {
      console.log('⚠️ Entry not in refund_cancellation_table. Triggering sync...\n');
      
      await pool.query(`
        UPDATE bookings 
        SET refund_status = 'initiated'
        WHERE invitee_name = 'Meera' 
          AND invitee_phone = '+91 9579865707'
          AND booking_start_at::date = '2026-02-04'
      `);
      
      console.log('✅ Sync triggered. Entry should now be in refund_cancellation_table\n');
    } else {
      console.log('✅ Entry already exists in refund_cancellation_table\n');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

fixMeeraRefund();
