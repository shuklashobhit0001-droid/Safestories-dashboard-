import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createPasswordResetTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating password reset tables...');

    // Create password_reset_tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(45),
        user_agent TEXT
      );
    `);
    console.log('✅ Created password_reset_tokens table');

    // Create indexes for password_reset_tokens
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_email 
      ON password_reset_tokens(email);
    `);
    console.log('✅ Created index on email');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_token 
      ON password_reset_tokens(token);
    `);
    console.log('✅ Created index on token');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_expires 
      ON password_reset_tokens(expires_at);
    `);
    console.log('✅ Created index on expires_at');

    // Create password_reset_attempts table for rate limiting
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_attempts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        attempted_at TIMESTAMP DEFAULT NOW(),
        success BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ Created password_reset_attempts table');

    // Create index for rate limiting queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reset_attempts_email_time 
      ON password_reset_attempts(email, attempted_at);
    `);
    console.log('✅ Created index on email and attempted_at');

    console.log('\n🎉 All password reset tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createPasswordResetTables();
