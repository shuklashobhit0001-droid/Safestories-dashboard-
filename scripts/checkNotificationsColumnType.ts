import pool from '../lib/db.js';

async function checkNotificationsSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    console.log('=== notifications table schema ===\n');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkNotificationsSchema();
