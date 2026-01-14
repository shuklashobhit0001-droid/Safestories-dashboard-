import pool from '../lib/db.js';

async function createAuditLogsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id SERIAL PRIMARY KEY,
        therapist_id VARCHAR(50),
        therapist_name VARCHAR(255),
        action_type VARCHAR(100) NOT NULL,
        action_description TEXT NOT NULL,
        client_name VARCHAR(255),
        timestamp VARCHAR(255),
        ip_address VARCHAR(50),
        is_visible BOOLEAN DEFAULT true
      )
    `);
    
    console.log('✓ audit_logs table created successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAuditLogsTable();
