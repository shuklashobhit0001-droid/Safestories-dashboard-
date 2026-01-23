import pool from '../lib/db';

async function addMissingForeignKeys() {
  try {
    console.log('Adding 8 missing foreign keys...\n');

    // 1. therapist_dashboard_stats.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE therapist_dashboard_stats
      ADD CONSTRAINT fk_therapist_dashboard_stats_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 1. therapist_dashboard_stats.therapist_id → therapists.therapist_id');

    // 2. therapist_clients_summary.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE therapist_clients_summary
      ADD CONSTRAINT fk_therapist_clients_summary_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 2. therapist_clients_summary.therapist_id → therapists.therapist_id');

    // 3. therapist_appointments_cache.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE therapist_appointments_cache
      ADD CONSTRAINT fk_therapist_appointments_cache_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 3. therapist_appointments_cache.therapist_id → therapists.therapist_id');

    // 4. therapist_resources.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE therapist_resources
      ADD CONSTRAINT fk_therapist_resources_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 4. therapist_resources.therapist_id → therapists.therapist_id');

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
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 7. client_additional_notes.booking_id → bookings.booking_id');

    // 8. client_session_notes.booking_id → bookings.booking_id
    await pool.query(`
      ALTER TABLE client_session_notes
      ADD CONSTRAINT fk_client_session_notes_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 8. client_session_notes.booking_id → bookings.booking_id');

    console.log('\n🎉 All 8 missing foreign keys added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addMissingForeignKeys();
