import pool from '../lib/db';

async function verifyNotificationsUserMatch() {
  try {
    // Check sample data
    const sample = await pool.query(`
      SELECT user_id, user_role FROM notifications LIMIT 5;
    `);
    console.log('Sample notifications.user_id:', sample.rows);

    // Check if user_id values are numeric
    const numeric = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE user_id ~ '^[0-9]+$') as numeric_ids,
        COUNT(*) FILTER (WHERE user_id !~ '^[0-9]+$') as non_numeric_ids
      FROM notifications
      WHERE user_id IS NOT NULL;
    `);
    console.log('\nNumeric check:', numeric.rows[0]);

    // Try matching with type casting
    const match = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM users u WHERE u.id::text = n.user_id)) as matching_users
      FROM notifications n
      WHERE user_id IS NOT NULL;
    `);
    console.log('\nMatching with users:', match.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyNotificationsUserMatch();
