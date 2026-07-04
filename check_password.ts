import pool from './lib/db';

async function checkPasswords() {
  try {
    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE role IN (\'admin\', \'sales\') AND is_active = true'
    );

    console.log('\n🔐 Credentials for active users:\n');
    result.rows.forEach((user: any) => {
      console.log(`Username: ${user.username} | Password: ${user.password}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPasswords();
