import pool from '../lib/db';

async function deleteShobhitBooking() {
  try {
    // Find the booking
    const findResult = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.invitee_phone,
        b.booking_resource_name,
        b.booking_invitee_time,
        r.refund_status
      FROM bookings b
      LEFT JOIN refund_cancellation_table r ON r.session_id = b.booking_id
      WHERE b.invitee_phone = '+916362474363'
        AND b.booking_resource_name LIKE '%Couples Therapy%'
        AND b.booking_host_name LIKE '%Ishika%'
    `);

    if (findResult.rows.length === 0) {
      console.log('❌ No matching record found');
      await pool.end();
      return;
    }

    console.log('\n=== Found Record ===');
    findResult.rows.forEach(row => {
      console.log(`Booking ID: ${row.booking_id}`);
      console.log(`Name: ${row.invitee_name}`);
      console.log(`Phone: ${row.invitee_phone}`);
      console.log(`Session: ${row.booking_resource_name}`);
      console.log(`Time: ${row.booking_invitee_time}`);
      console.log(`Refund Status: ${row.refund_status}\n`);
    });

    const bookingIds = findResult.rows.map(r => r.booking_id);

    await pool.query('BEGIN');

    const refundResult = await pool.query(
      'DELETE FROM refund_cancellation_table WHERE session_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${refundResult.rowCount} from refund_cancellation_table`);

    const notesResult = await pool.query(
      'DELETE FROM client_session_notes WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${notesResult.rowCount} from client_session_notes`);

    const additionalNotesResult = await pool.query(
      'DELETE FROM client_additional_notes WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${additionalNotesResult.rowCount} from client_additional_notes`);

    const docFormResult = await pool.query(
      'DELETE FROM client_doc_form WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${docFormResult.rowCount} from client_doc_form`);

    const notificationsResult = await pool.query(
      'DELETE FROM notifications WHERE related_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${notificationsResult.rowCount} from notifications`);

    const bookingsResult = await pool.query(
      'DELETE FROM bookings WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${bookingsResult.rowCount} from bookings`);

    await pool.query('COMMIT');
    console.log(`\n✅ Successfully deleted all records for booking ID(s): ${bookingIds.join(', ')}`);

    await pool.end();
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error:', error);
    await pool.end();
  }
}

deleteShobhitBooking();
