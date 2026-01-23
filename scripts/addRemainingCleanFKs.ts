import pool from '../lib/db';

async function addRemainingCleanFKs() {
  try {
    // Check data type first
    const typeCheck = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'client_additional_notes' AND column_name = 'booking_id';
    `);
    console.log('client_additional_notes.booking_id type:', typeCheck.rows[0]);

    const typeCheck2 = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'booking_id';
    `);
    console.log('bookings.booking_id type:', typeCheck2.rows[0]);
    console.log('');

    // Add FK for client_additional_notes
    await pool.query(`
      ALTER TABLE client_additional_notes
      ADD CONSTRAINT fk_client_additional_notes_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ client_additional_notes.booking_id → bookings.booking_id');

    console.log('\n🎉 Done! Summary:');
    console.log('✅ Added: 3 FKs (therapist_dashboard_stats, therapist_clients_summary, therapist_appointments_cache)');
    console.log('✅ Added: 2 FKs (client_transfer_history from/to)');
    console.log('✅ Added: 1 FK (client_additional_notes)');
    console.log('⚠️  Skipped: therapist_resources (orphaned therapist_id: 58605)');
    console.log('⚠️  Skipped: client_session_notes (orphaned booking_id: 56430)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addRemainingCleanFKs();
