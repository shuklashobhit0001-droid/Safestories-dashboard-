import { Pool } from 'pg';

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false,
});

async function checkSOSLogs() {
  try {
    console.log('🔍 Checking SOS-related audit logs and notifications...\n');

    // 1. Check recent SOS risk assessments
    console.log('📋 Recent SOS Risk Assessments:');
    const sosAssessments = await pool.query(`
      SELECT id, therapist_name, client_name, risk_severity_level, 
             webhook_sent, webhook_response, created_at
      FROM sos_risk_assessments 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (sosAssessments.rows.length > 0) {
      sosAssessments.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Therapist: ${row.therapist_name}`);
        console.log(`   Client: ${row.client_name}`);
        console.log(`   Severity: ${row.risk_severity_level}`);
        console.log(`   Webhook Sent: ${row.webhook_sent}`);
        console.log(`   Webhook Response: ${row.webhook_response}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('   No SOS assessments found');
    }

    // 2. Check recent audit logs for SOS actions
    console.log('\n📝 Recent SOS Audit Logs:');
    const auditLogs = await pool.query(`
      SELECT therapist_name, action_type, action_description, 
             client_name, created_at
      FROM audit_logs 
      WHERE action_type = 'raise_sos'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (auditLogs.rows.length > 0) {
      auditLogs.rows.forEach((row, index) => {
        console.log(`${index + 1}. Therapist: ${row.therapist_name}`);
        console.log(`   Action: ${row.action_type}`);
        console.log(`   Description: ${row.action_description}`);
        console.log(`   Client: ${row.client_name}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('   No SOS audit logs found');
    }

    // 3. Check recent admin notifications for SOS
    console.log('\n🔔 Recent SOS Admin Notifications:');
    const notifications = await pool.query(`
      SELECT notification_type, title, message, related_id, created_at
      FROM notifications 
      WHERE notification_type = 'sos_ticket'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (notifications.rows.length > 0) {
      notifications.rows.forEach((row, index) => {
        console.log(`${index + 1}. Type: ${row.notification_type}`);
        console.log(`   Title: ${row.title}`);
        console.log(`   Message: ${row.message}`);
        console.log(`   Related ID: ${row.related_id}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('   No SOS notifications found');
    }

    // 4. Check if there are any recent audit logs at all
    console.log('\n📊 Recent Audit Logs (All Types):');
    const recentAuditLogs = await pool.query(`
      SELECT therapist_name, action_type, action_description, created_at
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    if (recentAuditLogs.rows.length > 0) {
      recentAuditLogs.rows.forEach((row, index) => {
        console.log(`${index + 1}. Therapist: ${row.therapist_name}`);
        console.log(`   Action: ${row.action_type}`);
        console.log(`   Description: ${row.action_description}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('   No recent audit logs found');
    }

    // 5. Check if there are any recent notifications at all
    console.log('\n📬 Recent Notifications (All Types):');
    const recentNotifications = await pool.query(`
      SELECT notification_type, title, message, created_at
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    if (recentNotifications.rows.length > 0) {
      recentNotifications.rows.forEach((row, index) => {
        console.log(`${index + 1}. Type: ${row.notification_type}`);
        console.log(`   Title: ${row.title}`);
        console.log(`   Message: ${row.message}`);
        console.log(`   Created: ${row.created_at}`);
        console.log('');
      });
    } else {
      console.log('   No recent notifications found');
    }

  } catch (error) {
    console.error('❌ Error checking SOS logs:', error);
  } finally {
    await pool.end();
  }
}

checkSOSLogs();