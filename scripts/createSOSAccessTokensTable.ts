import pool from '../lib/db.js';

const createSOSAccessTokensTable = async () => {
  try {
    console.log('Creating sos_access_tokens table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS sos_access_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) UNIQUE NOT NULL,
        sos_assessment_id INTEGER REFERENCES sos_risk_assessments(id) ON DELETE CASCADE,
        client_email VARCHAR(255) NOT NULL,
        client_phone VARCHAR(50) NOT NULL,
        client_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        accessed_at TIMESTAMP,
        accessed_by VARCHAR(255),
        access_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        revoked_at TIMESTAMP,
        revoked_by VARCHAR(255)
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ sos_access_tokens table created successfully');
    
    // Create indexes for better performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_sos_tokens_token ON sos_access_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_sos_tokens_assessment_id ON sos_access_tokens(sos_assessment_id);
      CREATE INDEX IF NOT EXISTS idx_sos_tokens_expires_at ON sos_access_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_sos_tokens_is_active ON sos_access_tokens(is_active);
    `;
    
    await pool.query(createIndexes);
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating sos_access_tokens table:', error);
  } finally {
    await pool.end();
  }
};

createSOSAccessTokensTable();
