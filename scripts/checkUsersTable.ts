import pool from '../lib/db';

async function checkUsersTable() {
  try {
    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users Table Structure:');
    console.log('======================');
    structure.rows.forEach((row) => {
      console.log(`- ${row.column_name} (${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''})`);
    });
    
    console.log('\n');
    
    // Get actual data
    const data = await pool.query('SELECT * FROM users;');
    
    console.log('Users Table Data:');
    console.log('=================');
    console.log(JSON.stringify(data.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsersTable();
