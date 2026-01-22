import pool from './lib/db';

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%therapist%' OR table_name LIKE '%resource%'
      ORDER BY table_name;
    `);
    
    console.log('Tables with therapist or resource:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkTables();
