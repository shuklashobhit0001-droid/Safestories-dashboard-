import pool from './lib/db';

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'therapist_resources'
      ORDER BY ordinal_position;
    `);
    
    console.log('therapist_resources table columns:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    const data = await pool.query('SELECT * FROM therapist_resources LIMIT 10');
    console.log('\nSample data:');
    console.log(JSON.stringify(data.rows, null, 2));
    
    await pool.end();
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkTable();
