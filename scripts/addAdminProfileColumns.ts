import pool from '../lib/db';

async function addAdminProfileColumns() {
  try {
    console.log('Adding profile columns to users table...');
    
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
    `);
    
    console.log('✓ Profile columns added successfully');
    
    // Update existing admin users to have full_name from name column
    await pool.query(`
      UPDATE users 
      SET full_name = name 
      WHERE full_name IS NULL AND name IS NOT NULL;
    `);
    
    console.log('✓ Migrated existing name data to full_name');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addAdminProfileColumns();
