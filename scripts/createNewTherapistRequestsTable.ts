import pool from '../api/lib/db.js';

async function createNewTherapistRequestsTable() {
  try {
    console.log('Creating new_therapist_requests table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS new_therapist_requests (
        request_id SERIAL PRIMARY KEY,
        therapist_name VARCHAR(255) NOT NULL,
        whatsapp_number VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        specializations TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ new_therapist_requests table created successfully');
    
    // Check table structure
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'new_therapist_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createNewTherapistRequestsTable();
