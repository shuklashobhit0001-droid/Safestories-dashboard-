import pool from '../lib/db';

async function createNewTables() {
  try {
    // Create all_clients_table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS all_clients_table (
        client_id VARCHAR(255) PRIMARY KEY,
        client_name VARCHAR(255),
        phone_number VARCHAR(50),
        email_id VARCHAR(255),
        no_of_sessions INTEGER DEFAULT 0,
        therapist_id VARCHAR(255),
        assigned_therapist VARCHAR(255)
      );
    `);
    console.log('✓ Created all_clients_table');

    // Create appointment_table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointment_table (
        session_id VARCHAR(255) PRIMARY KEY,
        session_timings TIMESTAMP,
        session_name VARCHAR(255),
        session_mode VARCHAR(50),
        client_id VARCHAR(255),
        client_name VARCHAR(255),
        contact_info TEXT,
        therapist_id VARCHAR(255),
        therapist_name VARCHAR(255)
      );
    `);
    console.log('✓ Created appointment_table');

    // Create refund_cancellation_table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refund_cancellation_table (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255),
        client_name VARCHAR(255),
        session_id VARCHAR(255),
        session_name VARCHAR(255),
        session_timings TIMESTAMP,
        payment_id VARCHAR(255),
        payment_status VARCHAR(50)
      );
    `);
    console.log('✓ Created refund_cancellation_table');

    console.log('\n✓ All tables created successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createNewTables();
