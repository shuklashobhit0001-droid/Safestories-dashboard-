import pool from '../lib/db';

async function addIshikaUser() {
  try {
    const result = await pool.query(`
      INSERT INTO users (username, password, name, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *;
    `, ['Ishika', 'Ishika123', 'Ishika', 'therapist']);
    
    console.log('Ishika user added successfully:');
    console.log(result.rows[0]);
    
    await pool.end();
  } catch (error) {
    console.error('Error adding Ishika user:', error);
    process.exit(1);
  }
}

addIshikaUser();