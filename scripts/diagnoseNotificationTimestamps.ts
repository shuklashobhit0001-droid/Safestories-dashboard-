import pool from '../lib/db.js';

async function diagnoseNotificationTimestamps() {
  console.log('=== NOTIFICATION TIMESTAMP DIAGNOSTIC ===\n');

  try {
    // 1. Check database timestamps
    console.log('1. DATABASE TIMESTAMPS:\n');
    const { rows: dbNotifs } = await pool.query(`
      SELECT 
        notification_id,
        title,
        created_at,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) as seconds_ago
      FROM notifications 
      ORDER BY notification_id DESC 
      LIMIT 5
    `);
    console.table(dbNotifs);

    // 2. Check created_at column type
    console.log('\n2. CREATED_AT COLUMN TYPE:\n');
    const { rows: columnInfo } = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'created_at'
    `);
    console.table(columnInfo);

    // 3. Simulate API response
    console.log('\n3. SIMULATED API RESPONSE:\n');
    const { rows: apiResponse } = await pool.query(`
      SELECT notification_id, notification_type, title, message, is_read, created_at, related_id
      FROM notifications 
      ORDER BY notification_id DESC 
      LIMIT 3
    `);
    console.log('Raw API data:');
    console.log(JSON.stringify(apiResponse, null, 2));

    // 4. Test JavaScript Date parsing
    console.log('\n4. JAVASCRIPT DATE PARSING TEST:\n');
    const testTimestamp = apiResponse[0].created_at;
    console.log('Raw timestamp from DB:', testTimestamp);
    console.log('Type:', typeof testTimestamp);
    
    const jsDate = new Date(testTimestamp);
    console.log('Parsed as Date:', jsDate);
    console.log('ISO String:', jsDate.toISOString());
    console.log('Is valid date:', !isNaN(jsDate.getTime()));
    
    const now = new Date();
    const diff = now.getTime() - jsDate.getTime();
    const minutes = Math.floor(diff / 60000);
    console.log('Current time:', now.toISOString());
    console.log('Difference (ms):', diff);
    console.log('Minutes ago:', minutes);
    console.log('Should display:', minutes < 1 ? 'Just now' : `${minutes}m ago`);

    // 5. Check for timezone issues
    console.log('\n5. TIMEZONE CHECK:\n');
    console.log('Database timezone:', (await pool.query('SHOW timezone')).rows[0].TimeZone);
    console.log('Node.js timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('System time:', new Date().toString());

    // 6. Check if created_at has default
    console.log('\n6. CREATED_AT DEFAULT VALUE:\n');
    const { rows: defaults } = await pool.query(`
      SELECT column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'created_at'
    `);
    console.log('Default:', defaults[0].column_default || 'None');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseNotificationTimestamps();
