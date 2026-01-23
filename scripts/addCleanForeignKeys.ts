import pool from '../lib/db';

async function addCleanForeignKeys() {
  try {
    console.log('Adding foreign keys for tables with clean data...\n');

    // 4. therapist_resources - SKIP (has orphaned therapist_id: 58605)
    console.log('⏭️  4. therapist_resources - SKIPPED (orphaned data: therapist_id 58605)');

    // 5. client_transfer_history.from_therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE client_transfer_history
      ADD CONSTRAINT fk_client_transfer_from_therapist
      FOREIGN KEY (from_therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE SET NULL;
    `);
    console.log('✅ 5. client_transfer_history.from_therapist_id → therapists.therapist_id');

    // 6. client_transfer_history.to_therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE client_transfer_history
      ADD CONSTRAINT fk_client_transfer_to_therapist
      FOREIGN KEY (to_therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE SET NULL;
    `);
    console.log('✅ 6. client_transfer_history.to_therapist_id → therapists.therapist_id');

    // 7. client_additional_notes.booking_id → bookings.booking_id
    await pool.query(`
      ALTER TABLE client_additional_notes
      ADD CONSTRAINT fk_client_additional_notes_booking
      FOREIGN KEY (booking_id::text) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 7. client_additional_notes.booking_id → bookings.booking_id');

    // 8. client_session_notes - SKIP (has orphaned booking_id: 56430)
    console.log('⏭️  8. client_session_notes - SKIPPED (orphaned data: booking_id 56430)');

    console.log('\n✅ Added 4 foreign keys (3 already added earlier + 3 new = 6 total)');
    console.log('⚠️  Skipped 2 tables with orphaned data');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addCleanForeignKeys();
