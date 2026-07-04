import pool from './lib/db';

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'leads'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 LEADS TABLE SCHEMA:\n');
    result.rows.forEach((col: any) => {
      console.log(`${col.column_name.padEnd(30)} ${col.data_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
