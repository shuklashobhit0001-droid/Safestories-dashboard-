import pool from '../lib/db';

async function checkNotifications() {
  // Check table structure
  const { rows: columns } = await pool.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'notifications'
    ORDER BY ordinal_position
  `);
  
  console.log('=== NOTIFICATIONS TABLE STRUCTURE ===');
  console.log(JSON.stringify(columns, null, 2));
  
  // Check if any records were ever inserted
  const { rows: count } = await pool.query('SELECT COUNT(*) FROM notifications');
  console.log('\n=== TOTAL RECORDS ===');
  console.log(count[0].count);
  
  // Check if notifications are being created elsewhere
  const { rows: allTables } = await pool.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename LIKE '%notif%'
  `);
  console.log('\n=== TABLES WITH "NOTIF" ===');
  console.log(allTables);

  await pool.end();
}

checkNotifications().catch(console.error);
