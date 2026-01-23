import pool from '../lib/db';

async function verifyDataConsistency() {
  try {
    console.log('=== CHECKING DATA CONSISTENCY ===\n');

    // 1. booking_cancelled vs bookings
    console.log('1. booking_cancelled vs bookings (same booking_id):\n');
    const check1 = await pool.query(`
      SELECT 
        bc.booking_id,
        bc.invitee_name as cancelled_name,
        b.invitee_name as booking_name,
        bc.invitee_email as cancelled_email,
        b.invitee_email as booking_email,
        CASE WHEN bc.invitee_name = b.invitee_name THEN '✅' ELSE '❌' END as name_match,
        CASE WHEN bc.invitee_email = b.invitee_email THEN '✅' ELSE '❌' END as email_match
      FROM booking_cancelled bc
      JOIN bookings b ON bc.booking_id = b.booking_id
      LIMIT 5;
    `);
    console.log(check1.rows);
    console.log('\n');

    // 2. payments vs bookings
    console.log('2. payments vs bookings (same booking_id):\n');
    const check2 = await pool.query(`
      SELECT 
        p.booking_id,
        p.invitee_name as payment_name,
        b.invitee_name as booking_name,
        p.invitee_email as payment_email,
        b.invitee_email as booking_email,
        p.amount as payment_amount,
        b.invitee_payment_amount as booking_amount,
        CASE WHEN p.invitee_name = b.invitee_name THEN '✅' ELSE '❌' END as name_match,
        CASE WHEN p.amount = b.invitee_payment_amount THEN '✅' ELSE '❌' END as amount_match
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      LIMIT 5;
    `);
    console.log(check2.rows);
    console.log('\n');

    // 3. client_session_notes vs bookings
    console.log('3. client_session_notes vs bookings (same booking_id):\n');
    const check3 = await pool.query(`
      SELECT 
        csn.booking_id,
        csn.client_name as note_client_name,
        b.invitee_name as booking_client_name,
        csn.host_name as note_host,
        b.booking_host_name as booking_host,
        CASE WHEN csn.client_name = b.invitee_name THEN '✅' ELSE '❌' END as client_match,
        CASE WHEN csn.host_name = b.booking_host_name THEN '✅' ELSE '❌' END as host_match
      FROM client_session_notes csn
      JOIN bookings b ON csn.booking_id = b.booking_id
      LIMIT 5;
    `);
    console.log(check3.rows);
    console.log('\n');

    // 4. refund_cancellation_table vs bookings
    console.log('4. refund_cancellation_table vs bookings (same session_id/booking_id):\n');
    const check4 = await pool.query(`
      SELECT 
        r.session_id,
        r.client_name as refund_client,
        b.invitee_name as booking_client,
        r.session_timings as refund_time,
        b.booking_start_at as booking_time,
        CASE WHEN r.client_name = b.invitee_name THEN '✅' ELSE '❌' END as client_match
      FROM refund_cancellation_table r
      JOIN bookings b ON r.session_id = b.booking_id
      LIMIT 5;
    `);
    console.log(check4.rows);
    console.log('\n');

    // 5. Check mismatches summary
    console.log('5. MISMATCH SUMMARY:\n');
    
    const mismatch1 = await pool.query(`
      SELECT COUNT(*) as mismatches
      FROM booking_cancelled bc
      JOIN bookings b ON bc.booking_id = b.booking_id
      WHERE bc.invitee_name != b.invitee_name OR bc.invitee_email != b.invitee_email;
    `);
    console.log(`booking_cancelled mismatches: ${mismatch1.rows[0].mismatches}`);

    const mismatch2 = await pool.query(`
      SELECT COUNT(*) as mismatches
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      WHERE p.invitee_name != b.invitee_name OR p.amount != b.invitee_payment_amount;
    `);
    console.log(`payments mismatches: ${mismatch2.rows[0].mismatches}`);

    const mismatch3 = await pool.query(`
      SELECT COUNT(*) as mismatches
      FROM client_session_notes csn
      JOIN bookings b ON csn.booking_id = b.booking_id
      WHERE csn.client_name != b.invitee_name;
    `);
    console.log(`client_session_notes mismatches: ${mismatch3.rows[0].mismatches}`);

    const mismatch4 = await pool.query(`
      SELECT COUNT(*) as mismatches
      FROM refund_cancellation_table r
      JOIN bookings b ON r.session_id = b.booking_id
      WHERE r.client_name != b.invitee_name;
    `);
    console.log(`refund_cancellation_table mismatches: ${mismatch4.rows[0].mismatches}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyDataConsistency();
