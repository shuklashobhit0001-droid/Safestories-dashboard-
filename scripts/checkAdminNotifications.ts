import pool from '../lib/db.js';

async function checkAdminNotifications() {
  console.log('=== Checking Admin Notifications in Database ===\n');

  try {
    // Get all admin notifications
    const result = await pool.query(`
      SELECT 
        notification_id,
        user_id,
        notification_type,
        title,
        message,
        related_id,
        is_read,
        created_at
      FROM notifications
      WHERE user_role = 'admin'
      ORDER BY created_at DESC
    `);

    console.log(`Total admin notifications: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('No admin notifications found in database.\n');
    } else {
      // Group by notification type
      const typeCount = {};
      result.rows.forEach(notif => {
        typeCount[notif.notification_type] = (typeCount[notif.notification_type] || 0) + 1;
      });

      console.log('=== Notifications by Type ===');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
      });

      console.log('\n=== Recent 10 Notifications ===\n');
      result.rows.slice(0, 10).forEach((notif, index) => {
        console.log(`${index + 1}. [${notif.notification_type}] ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.is_read}`);
        console.log(`   Created: ${notif.created_at}`);
        console.log(`   User ID: ${notif.user_id}\n`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAdminNotifications();
