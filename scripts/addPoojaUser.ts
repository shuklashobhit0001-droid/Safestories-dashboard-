import pool from '../lib/db';

async function addPoojaUser() {
  try {
    await pool.query(`
      INSERT INTO users (username, password, name, role)
      VALUES ('poojajain@safestories.in', 'Safestories@2026', 'Pooja Jain', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('✓ User added successfully');
    console.log('  Username: poojajain@safestories.in');
    console.log('  Password: Safestories@2026');
    
    // Show all users
    const result = await pool.query('SELECT id, username, name, role FROM users;');
    console.log('\nAll users:');
    console.log(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addPoojaUser();
