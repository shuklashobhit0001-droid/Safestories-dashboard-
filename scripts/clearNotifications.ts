import pool from '../lib/db.js';

async function clearNotifications() {
  try {
    const result = await pool.query('DELETE FROM notifications');
    console.log(`✓ Deleted ${result.rowCount} notifications`);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearNotifications();
