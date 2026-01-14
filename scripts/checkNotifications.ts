import pool from '../lib/db.js';

async function checkNotifications() {
  try {
    // Check Ishika's user ID
    const userResult = await pool.query(
      "SELECT id, username, therapist_id FROM users WHERE username = 'Ishika'"
    );
    console.log('Ishika user:', userResult.rows[0]);

    const ishikaUserId = userResult.rows[0]?.id;

    // Check notifications for Ishika
    const notificationsResult = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [ishikaUserId]
    );

    console.log(`\nNotifications for Ishika (user_id: ${ishikaUserId}):`);
    console.log(notificationsResult.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNotifications();
