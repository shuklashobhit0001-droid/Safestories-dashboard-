import pool from '../lib/db.js';

async function createTransferHistoryTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_transfer_history (
        transfer_id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255),
        client_phone VARCHAR(50),
        from_therapist_id VARCHAR(50),
        from_therapist_name VARCHAR(255),
        to_therapist_id VARCHAR(50) NOT NULL,
        to_therapist_name VARCHAR(255) NOT NULL,
        transferred_by_admin_id INTEGER,
        transferred_by_admin_name VARCHAR(255),
        transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        notes TEXT
      )
    `);
    
    console.log('✓ client_transfer_history table created successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTransferHistoryTable();
