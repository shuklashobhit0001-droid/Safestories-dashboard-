import pool from '../lib/db';

async function checkStructure() {
  try {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'all_clients_table' 
      ORDER BY ordinal_position;
    `);
    
    console.log('all_clients_table columns:\n');
    cols.rows.forEach(col => console.log(`  ${col.column_name} (${col.data_type})`));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStructure();
