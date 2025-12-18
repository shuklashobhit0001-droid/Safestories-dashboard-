import pool from '../lib/db';

async function deleteTherapist() {
  try {
    await pool.query("DELETE FROM therapists WHERE name = 'safestories'");
    console.log('✓ Deleted safestories therapist');
    
    const result = await pool.query('SELECT * FROM therapists ORDER BY name');
    console.log('\nRemaining therapists:');
    console.table(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTherapist();
