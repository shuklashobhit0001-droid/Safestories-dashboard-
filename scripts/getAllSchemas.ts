import pool from '../lib/db';

async function getAllTableSchemas() {
  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('=== DATABASE SCHEMA ===\n');

    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      // Get columns for each table
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      console.log(`Table ${tableName} {`);
      
      for (const col of columnsResult.rows) {
        const colName = col.column_name;
        let dataType = col.data_type;
        
        if (col.character_maximum_length) {
          dataType += `(${col.character_maximum_length})`;
        }
        
        const nullable = col.is_nullable === 'NO' ? '[not null]' : '';
        const defaultVal = col.column_default ? `[default: ${col.column_default}]` : '';
        
        console.log(`  ${colName} ${dataType} ${nullable} ${defaultVal}`.trim());
      }
      
      console.log('}\n');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getAllTableSchemas();
