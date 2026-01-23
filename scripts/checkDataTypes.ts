import pool from '../lib/db';

async function checkDataTypes() {
  try {
    const usersId = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id';
    `);
    console.log('users.id type:', usersId.rows[0]);

    const notifUserId = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'user_id';
    `);
    console.log('notifications.user_id type:', notifUserId.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDataTypes();
