import pool from './lib/db';

async function listUsers() {
  try {
    const result = await pool.query(
      'SELECT id, username, name, role, is_active FROM users ORDER BY id'
    );

    console.log('\n👥 Users in database:\n');
    result.rows.forEach((user: any) => {
      console.log(`ID: ${user.id} | Username: ${user.username} | Name: ${user.name} | Role: ${user.role} | Active: ${user.is_active ? '✅' : '❌'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();
