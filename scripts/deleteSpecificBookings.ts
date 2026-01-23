import pool from '../lib/db';

async function deleteSpecificBookings() {
  const bookingIds = [673133, 673116];
  
  try {
    await pool.query('BEGIN');

    // Delete from refund_cancellation_table
    const refundResult = await pool.query(
      'DELETE FROM refund_cancellation_table WHERE session_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${refundResult.rowCount} from refund_cancellation_table`);

    // Delete from client_session_notes
    const notesResult = await pool.query(
      'DELETE FROM client_session_notes WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${notesResult.rowCount} from client_session_notes`);

    // Delete from client_additional_notes
    const additionalNotesResult = await pool.query(
      'DELETE FROM client_additional_notes WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${additionalNotesResult.rowCount} from client_additional_notes`);

    // Delete from client_doc_form
    const docFormResult = await pool.query(
      'DELETE FROM client_doc_form WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${docFormResult.rowCount} from client_doc_form`);

    // Delete from notifications
    const notificationsResult = await pool.query(
      'DELETE FROM notifications WHERE related_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${notificationsResult.rowCount} from notifications`);

    // Delete from bookings
    const bookingsResult = await pool.query(
      'DELETE FROM bookings WHERE booking_id = ANY($1)',
      [bookingIds]
    );
    console.log(`Deleted ${bookingsResult.rowCount} from bookings`);

    await pool.query('COMMIT');
    console.log('\n✅ Successfully deleted all records for booking IDs: 673133, 673116');

    await pool.end();
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error:', error);
    await pool.end();
  }
}

deleteSpecificBookings();
