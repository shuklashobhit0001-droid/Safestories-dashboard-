import pool from './lib/db';

async function checkSessionNotes() {
  try {
    const clients = ['Pragna', 'Nisha Jha', 'Pranoti Suranje'];

    console.log('\n📝 CHECKING SESSION NOTES FOR 3 CLIENTS:\n');

    for (const clientName of clients) {
      const bookingResult = await pool.query(`
        SELECT booking_id FROM bookings
        WHERE invitee_name = $1
        AND client_rating IS NOT NULL
      `, [clientName]);

      if (bookingResult.rows.length === 0) {
        console.log(`❌ ${clientName} - No booking found`);
        continue;
      }

      const bookingId = bookingResult.rows[0].booking_id;

      // Check all note types
      const notesResult = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM client_session_notes WHERE booking_id = $1) as session_notes,
          (SELECT COUNT(*) FROM client_progress_notes WHERE booking_id = $1) as progress_notes,
          (SELECT COUNT(*) FROM free_consultation_pretherapy_notes WHERE booking_id = $1) as pretherapy_notes,
          (SELECT COUNT(*) FROM pretherapy_call_forms WHERE booking_id::text = $2) as forms,
          (SELECT COUNT(*) FROM client_case_history WHERE booking_id = $1) as case_history
      `, [bookingId, bookingId]);

      const notes = notesResult.rows[0];
      const hasAnyNotes = Object.values(notes).some(val => val > 0);

      console.log(`✅ ${clientName} (Booking: ${bookingId})`);
      console.log(`   Session Notes: ${notes.session_notes}`);
      console.log(`   Progress Notes: ${notes.progress_notes}`);
      console.log(`   Pretherapy Notes: ${notes.pretherapy_notes}`);
      console.log(`   Forms: ${notes.forms}`);
      console.log(`   Case History: ${notes.case_history}`);
      console.log(`   Has Any Notes: ${hasAnyNotes ? 'YES → Status=completed' : 'NO → Status=pending_notes'}`);
      console.log('---');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSessionNotes();
