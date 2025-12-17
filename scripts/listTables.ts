import pool from '../lib/db';

async function listTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Tables in safestories_db:');
    console.log('========================');
    result.rows.forEach((row) => {
      console.log(`- ${row.table_name}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

listTables();
