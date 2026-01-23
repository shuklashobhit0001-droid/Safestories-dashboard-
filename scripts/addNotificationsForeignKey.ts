import pool from '../lib/db';

async function addNotificationsForeignKey() {
  try {
    // First convert user_id to integer type
    console.log('Converting notifications.user_id to integer...');
    await pool.query(`
      ALTER TABLE notifications 
      ALTER COLUMN user_id TYPE integer USING user_id::integer;
    `);
    console.log('✅ Column type converted');

    // Now add the foreign key
    await pool.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT fk_notifications_user
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE;
    `);
    console.log('✅ notifications.user_id → users.id');

    console.log('\n🎉 Foreign key added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addNotificationsForeignKey();
