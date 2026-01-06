import pool from '../lib/db.js';

async function getAllTablesDetails() {
  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('='.repeat(80));
    console.log('DATABASE TABLES OVERVIEW');
    console.log('='.repeat(80));

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      
      console.log(`\n\n${'='.repeat(80)}`);
      console.log(`TABLE: ${tableName.toUpperCase()}`);
      console.log('='.repeat(80));

      // Get column details
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      console.log('\nCOLUMNS:');
      columnsResult.rows.forEach((col) => {
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`  - ${col.column_name}: ${col.data_type}${length}`);
      });

      // Get 2 sample entries
      const dataResult = await pool.query(`SELECT * FROM ${tableName} LIMIT 2;`);
      
      console.log(`\nSAMPLE DATA (${dataResult.rows.length} entries):`);
      if (dataResult.rows.length > 0) {
        dataResult.rows.forEach((row, index) => {
          console.log(`\n  Entry ${index + 1}:`);
          Object.keys(row).forEach(key => {
            let value = row[key];
            if (value && typeof value === 'string' && value.length > 100) {
              value = value.substring(0, 100) + '...';
            }
            console.log(`    ${key}: ${value}`);
          });
        });
      } else {
        console.log('  (No data in this table)');
      }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('END OF DATABASE OVERVIEW');
    console.log('='.repeat(80));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getAllTablesDetails();
