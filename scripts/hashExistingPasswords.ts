import pool from '../lib/db.js';
import bcrypt from 'bcrypt';

async function hashExistingPasswords() {
  try {
    console.log('Starting password migration...\n');
    
    const result = await pool.query('SELECT id, username, password FROM users');
    
    for (const user of result.rows) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (user.password.startsWith('$2b$')) {
        console.log(`✓ ${user.username} - already hashed`);
        continue;
      }
      
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
      console.log(`✓ ${user.username} - password hashed`);
    }
    
    console.log('\n✓ All passwords migrated successfully');
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

hashExistingPasswords();
