import pool from '../lib/db.js';

async function alterNotificationsUserIdToText() {
  try {
    console.log('=== Altering notifications.user_id to VARCHAR(50) ===\n');
    
    await pool.query(`
      ALTER TABLE notifications 
      ALTER COLUMN user_id TYPE VARCHAR(50);
    `);
    
    console.log('✓ Column altered successfully\n');
    console.log('user_id is now VARCHAR(50)');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

alterNotificationsUserIdToText();
