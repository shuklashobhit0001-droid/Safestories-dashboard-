import pool from '../lib/db';

async function updateAdminNames() {
  try {
    await pool.query(
      "UPDATE users SET full_name = 'Pooja Jain' WHERE username = 'admin'"
    );
    
    await pool.query(
      "UPDATE users SET full_name = 'Pooja Jain' WHERE username = 'poojajain@safestories.in'"
    );
    
    console.log('✓ Updated admin full names to "Pooja Jain"');
    
    const result = await pool.query("SELECT id, username, full_name, role FROM users WHERE role = 'admin'");
    console.log('\nAdmin users:');
    result.rows.forEach(user => {
      console.log(`  ${user.username}: ${user.full_name}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAdminNames();
