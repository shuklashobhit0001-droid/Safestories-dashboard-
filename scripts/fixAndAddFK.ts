import pool from '../lib/db';

async function fixAndAddFK() {
  try {
    // Convert client_additional_notes.booking_id to text
    console.log('Converting client_additional_notes.booking_id to text...');
    await pool.query(`
      ALTER TABLE client_additional_notes 
      ALTER COLUMN booking_id TYPE text USING booking_id::text;
    `);
    console.log('✅ Type converted\n');

    // Add FK
    await pool.query(`
      ALTER TABLE client_additional_notes
      ADD CONSTRAINT fk_client_additional_notes_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ client_additional_notes.booking_id → bookings.booking_id');

    console.log('\n🎉 FINAL SUMMARY:');
    console.log('✅ Total FKs added in this session: 6');
    console.log('  1. therapist_dashboard_stats → therapists');
    console.log('  2. therapist_clients_summary → therapists');
    console.log('  3. therapist_appointments_cache → therapists');
    console.log('  4. client_transfer_history (from) → therapists');
    console.log('  5. client_transfer_history (to) → therapists');
    console.log('  6. client_additional_notes → bookings');
    console.log('\n⚠️  Skipped (orphaned data):');
    console.log('  - therapist_resources (therapist_id: 58605)');
    console.log('  - client_session_notes (booking_id: 56430)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixAndAddFK();
