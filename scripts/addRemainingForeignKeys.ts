import pool from '../lib/db';

async function addRemainingForeignKeys() {
  try {
    // 1. client_doc_form.booking_id → bookings.booking_id
    await pool.query(`
      ALTER TABLE client_doc_form
      ADD CONSTRAINT fk_client_doc_form_booking
      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      ON DELETE CASCADE;
    `);
    console.log('✅ 1. client_doc_form.booking_id → bookings.booking_id');

    // 2. notifications.user_id → users.id
    await pool.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT fk_notifications_user
      FOREIGN KEY (user_id) REFERENCES users(id::text)
      ON DELETE CASCADE;
    `);
    console.log('✅ 2. notifications.user_id → users.id');

    console.log('\n🎉 All remaining foreign keys added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addRemainingForeignKeys();
