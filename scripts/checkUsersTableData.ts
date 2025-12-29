import pool from '../lib/db.js';

async function checkUsersTable() {
  try {
    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('=== USERS TABLE STRUCTURE ===');
    structure.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    // Get all users data
    const users = await pool.query('SELECT * FROM users');

    console.log('\n=== USERS TABLE DATA ===');
    console.log(`Total users: ${users.rows.length}\n`);
    users.rows.forEach((user, i) => {
      console.log(`User ${i + 1}:`, user);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
