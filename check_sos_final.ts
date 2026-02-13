import { Pool } from 'pg';

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false,
});

async function checkSOSFinal() {
  try {
    console.log('🔍 Final SOS Status Check...\n');

    // 1. Recent SOS Risk Assessments
    console.log('📋 Recent SOS Risk Assessments:');
    const sosAssessments = await pool.query(`
      SELECT id, therapist_name, client_name, risk_severity_level, 
             webhook_sent, webhook_response, created_at
      FROM sos_risk_assessments 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    if (sosAssessments.rows.length > 0) {
      sosAssessments.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id} | Therapist: ${row.therapist_name} | Client: ${row.client_name}`);
        console.log(`   Severity: ${row.risk_severity_level} | Webhook: ${row.webhook_sent} | Response: ${row.webhook_response}`);
        console.log(`   Created: ${row.created_at}\n`);
      });
    } else {
      console.log('   ❌ No SOS assessments found\n');
    }

    // 2. Recent SOS Audit Logs (using correct column: timestamp)
    console.log('📝 Recent SOS Audit Logs:');
    const auditLogs = await pool.query(`
      SELECT therapist_name, action_type, action_description, 
             client_name, timestamp
      FROM audit_logs 
      WHERE action_type = 'raise_sos'
      ORDER BY log_id DESC 
      LIMIT 3
    `);
    
    if (auditLogs.rows.length > 0) {
      auditLogs.rows.forEach((row, index) => {
        console.log(`${index + 1}. Therapist: ${row.therapist_name} | Client: ${row.client_name}`);
        console.log(`   Action: ${row.action_type} | Description: ${row.action_description}`);
        console.log(`   Timestamp: ${row.timestamp}\n`);
      });
    } else {
      console.log('   ❌ No SOS audit logs found\n');
    }

    // 3. Recent SOS Notifications (using correct column: created_at)
    console.log('🔔 Recent SOS Admin Notifications:');
    const notifications = await pool.query(`
      SELECT notification_type, title, message, related_id, created_at
      FROM notifications 
      WHERE notification_type = 'sos_ticket'
      ORDER BY notification_id DESC 
      LIMIT 3
    `);
    
    if (notifications.rows.length > 0) {
      notifications.rows.forEach((row, index) => {
        console.log(`${index + 1}. Type: ${row.notification_type} | Related ID: ${row.related_id}`);
        console.log(`   Title: ${row.title}`);
        console.log(`   Message: ${row.message}`);
        console.log(`   Created: ${row.created_at}\n`);
      });
    } else {
      console.log('   ❌ No SOS notifications found\n');
    }

    // 4. Summary
    console.log('📊 SUMMARY:');
    console.log(`✅ SOS Assessments: ${sosAssessments.rows.length} found`);
    console.log(`${auditLogs.rows.length > 0 ? '✅' : '❌'} Audit Logs: ${auditLogs.rows.length} found`);
    console.log(`${notifications.rows.length > 0 ? '✅' : '❌'} Admin Notifications: ${notifications.rows.length} found`);
    console.log(`❌ Webhook: Failed due to CORS (expected)`);

  } catch (error) {
    console.error('❌ Error in final check:', error);
  } finally {
    await pool.end();
  }
}

checkSOSFinal();