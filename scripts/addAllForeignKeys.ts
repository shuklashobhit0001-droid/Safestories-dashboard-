import pool from '../lib/db';

async function addAllForeignKeys() {
  try {
    // 1. users.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE SET NULL;
    `);
    console.log('✅ 1. users.therapist_id → therapists.therapist_id');

    // 2. booking_cancelled.booking_id → bookings.booking_id
    await pool.query(`
      ALTER TABLE booking_cancelled
      ADD CONSTRAINT fk_booking_cancelled_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 2. booking_cancelled.booking_id → bookings.booking_id');

    // 3. payments.booking_id → bookings.booking_id
    await pool.query(`
      ALTER TABLE payments
      ADD CONSTRAINT fk_payments_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 3. payments.booking_id → bookings.booking_id');

    // 4. client_additional_notes.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE client_additional_notes
      ADD CONSTRAINT fk_client_notes_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE SET NULL;
    `);
    console.log('✅ 4. client_additional_notes.therapist_id → therapists.therapist_id');

    // 5. audit_logs.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE audit_logs
      ADD CONSTRAINT fk_audit_logs_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE SET NULL;
    `);
    console.log('✅ 5. audit_logs.therapist_id → therapists.therapist_id');

    // 6. bookings.therapist_id → therapists.therapist_id
    await pool.query(`
      ALTER TABLE bookings
      ADD CONSTRAINT fk_bookings_therapist
      FOREIGN KEY (therapist_id) REFERENCES therapists(therapist_id)
      ON DELETE SET NULL;
    `);
    console.log('✅ 6. bookings.therapist_id → therapists.therapist_id');

    console.log('\n🎉 All 6 foreign keys added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addAllForeignKeys();
