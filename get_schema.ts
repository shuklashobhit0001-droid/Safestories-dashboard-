import pool from './lib/db';

async function getSchema() {
  try {
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 DATABASE SCHEMA\n');
    console.log(`Total tables: ${tablesResult.rows.length}\n`);

    // Get columns for each table
    for (const { table_name } of tablesResult.rows) {
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table_name]);

      console.log(`\n📋 ${table_name.toUpperCase()}`);
      console.log('─'.repeat(60));
      columnsResult.rows.forEach((col: any) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(15)} ${nullable}${defaultVal}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getSchema();
