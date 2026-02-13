import { Pool } from 'pg';

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false,
});

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structures...\n');

    // Check audit_logs table structure
    console.log('📋 Audit Logs Table Structure:');
    const auditLogsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
      ORDER BY ordinal_position
    `);
    
    if (auditLogsStructure.rows.length > 0) {
      auditLogsStructure.rows.forEach((row) => {
        console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('   Table not found or no columns');
    }

    // Check notifications table structure
    console.log('\n🔔 Notifications Table Structure:');
    const notificationsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);
    
    if (notificationsStructure.rows.length > 0) {
      notificationsStructure.rows.forEach((row) => {
        console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('   Table not found or no columns');
    }

    // Check recent audit logs with correct column names
    console.log('\n📝 Recent Audit Logs (using correct columns):');
    const auditLogs = await pool.query(`
      SELECT * FROM audit_logs 
      WHERE action_type = 'raise_sos'
      ORDER BY timestamp DESC 
      LIMIT 3
    `);
    
    if (auditLogs.rows.length > 0) {
      auditLogs.rows.forEach((row, index) => {
        console.log(`${index + 1}. Therapist: ${row.therapist_name}`);
        console.log(`   Action: ${row.action_type}`);
        console.log(`   Description: ${row.action_description}`);
        console.log(`   Client: ${row.client_name}`);
        console.log(`   Timestamp: ${row.timestamp}`);
        console.log('');
      });
    } else {
      console.log('   No SOS audit logs found');
    }

    // Check recent notifications with correct column names
    console.log('\n🔔 Recent SOS Notifications (using correct columns):');
    const notifications = await pool.query(`
      SELECT * FROM notifications 
      WHERE notification_type = 'sos_ticket'
      ORDER BY timestamp DESC 
      LIMIT 3
    `);
    
    if (notifications.rows.length > 0) {
      notifications.rows.forEach((row, index) => {
        console.log(`${index + 1}. Type: ${row.notification_type}`);
        console.log(`   Title: ${row.title}`);
        console.log(`   Message: ${row.message}`);
        console.log(`   Related ID: ${row.related_id}`);
        console.log(`   Timestamp: ${row.timestamp}`);
        console.log('');
      });
    } else {
      console.log('   No SOS notifications found');
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();