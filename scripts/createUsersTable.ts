import pool from '../lib/db';

async function createUsersTable() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✓ Users table created successfully');
    
    // Insert default admin user
    await pool.query(`
      INSERT INTO users (username, password, name, role)
      VALUES ('admin', 'admin123', 'Pooja Jain', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('✓ Default admin user created (username: admin, password: admin123)');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createUsersTable();
