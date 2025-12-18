import pool from '../lib/db';

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_requests (
        request_id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_whatsapp VARCHAR(20) NOT NULL,
        client_email VARCHAR(255),
        therapy_type VARCHAR(255) NOT NULL,
        therapist_name VARCHAR(255) NOT NULL,
        booking_link TEXT,
        status VARCHAR(50) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✓ booking_requests table created successfully');
    await pool.end();
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createTable();
