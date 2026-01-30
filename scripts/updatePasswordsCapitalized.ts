import pool from '../lib/db.js';

async function updatePasswords() {
  try {
    console.log('🔄 Updating passwords to capitalize first letter...\n');
    
    const updates = [
      { id: 1, password: 'Admin123' },
      { id: 2, password: 'Admin123' },
      { id: 11, password: 'Admin123' },
      { id: 4, password: 'Ambika123' },
      { id: 3, password: 'Ishika123' },
      { id: 5, password: 'Aastha123' },
      { id: 7, password: 'Anjali123' },
      { id: 8, password: 'Indrayani123' },
      { id: 9, password: 'Muskan123' }
    ];

    for (const update of updates) {
      const user = await pool.query('SELECT username FROM users WHERE id = $1', [update.id]);
      if (user.rows.length > 0) {
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [update.password, update.id]);
        console.log(`✓ ${user.rows[0].username} → ${update.password}`);
      }
    }
    
    console.log('\n✅ All passwords updated successfully');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updatePasswords();
