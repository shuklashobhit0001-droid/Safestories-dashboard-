import pool from '../lib/db';

async function showUsers() {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    
    console.log('\n=== USERS TABLE ===\n');
    console.log(`Total users: ${result.rows.length}\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Therapist ID: ${user.therapist_id}`);
      console.log(`  Full Name: ${user.full_name}`);
      console.log(`  Created At: ${user.created_at}`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showUsers();
