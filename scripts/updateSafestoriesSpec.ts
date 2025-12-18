import pool from '../lib/db';

async function updateSpec() {
  try {
    await pool.query(
      "UPDATE therapists SET specialization = $1 WHERE therapist_id = $2",
      ['EAP/Employee Assistance Program', '58605']
    );
    
    const result = await pool.query("SELECT * FROM therapists WHERE therapist_id = '58605'");
    console.log('✓ Updated safestories therapist:');
    console.table(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateSpec();
