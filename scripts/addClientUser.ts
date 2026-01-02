import pool from '../lib/db';

async function addClientUser() {
  try {
    await pool.query(`
      INSERT INTO users (username, password, name, role, full_name, therapist_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ['Shobhit', 'Shobhit123', 'Shobhit Shukla', 'client', 'Shobhit Shukla', null]);

    console.log('✓ Client user added successfully');
    
    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['Shobhit']);
    console.log('\nNew user:', result.rows[0]);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addClientUser();
