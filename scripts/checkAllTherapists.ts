import pool from '../lib/db';

async function checkTherapists() {
  try {
    const result = await pool.query('SELECT * FROM therapists ORDER BY name;');
    console.log('All therapists:');
    console.table(result.rows);
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTherapists();
