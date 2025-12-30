import pool from '../lib/db';

async function checkUsersTherapist() {
  try {
    const result = await pool.query(`
      SELECT id, username, role, therapist_id 
      FROM users 
      WHERE role = 'therapist'
    `);
    
    console.log('\nTherapist users:');
    console.table(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsersTherapist();
