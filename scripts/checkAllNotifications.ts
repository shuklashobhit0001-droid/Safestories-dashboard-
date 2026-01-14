import pool from '../lib/db';

async function checkAllNotifications() {
  const { rows } = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
  
  console.log(`=== TOTAL NOTIFICATIONS: ${rows.length} ===\n`);
  
  if (rows.length > 0) {
    console.log('Sample notifications:');
    console.log(JSON.stringify(rows.slice(0, 5), null, 2));
    
    const { rows: byRole } = await pool.query(`
      SELECT user_role, COUNT(*) as count 
      FROM notifications 
      GROUP BY user_role
    `);
    console.log('\n=== BY ROLE ===');
    console.log(byRole);
    
    const { rows: byType } = await pool.query(`
      SELECT notification_type, COUNT(*) as count 
      FROM notifications 
      GROUP BY notification_type
    `);
    console.log('\n=== BY TYPE ===');
    console.log(byType);
  }

  await pool.end();
}

checkAllNotifications().catch(console.error);
