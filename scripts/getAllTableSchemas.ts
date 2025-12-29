import pool from '../lib/db';

async function getAllTableSchemas() {
  try {
    console.log('📊 DATABASE SCHEMA OVERVIEW\n');
    console.log('=' .repeat(80));

    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log(`\n🗂️  TOTAL TABLES: ${tablesResult.rows.length}\n`);

    // Get schema for each table
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`\n📋 TABLE: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(50));

      // Get column details
      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      // Get primary keys
      const pkResult = await pool.query(`
        SELECT column_name
        FROM information_schema.key_column_usage
        WHERE table_name = $1 
          AND constraint_name LIKE '%_pkey'
      `, [tableName]);

      const primaryKeys = pkResult.rows.map(row => row.column_name);

      // Get foreign keys
      const fkResult = await pool.query(`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = $1;
      `, [tableName]);

      // Display columns
      columnsResult.rows.forEach(col => {
        const isPK = primaryKeys.includes(col.column_name);
        const fk = fkResult.rows.find(f => f.column_name === col.column_name);
        
        let typeInfo = col.data_type;
        if (col.character_maximum_length) {
          typeInfo += `(${col.character_maximum_length})`;
        }

        let constraints = [];
        if (isPK) constraints.push('PK');
        if (fk) constraints.push(`FK -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        if (col.is_nullable === 'NO') constraints.push('NOT NULL');
        if (col.column_default) constraints.push(`DEFAULT: ${col.column_default}`);

        const constraintStr = constraints.length > 0 ? ` [${constraints.join(', ')}]` : '';
        
        console.log(`  ${col.column_name.padEnd(25)} ${typeInfo.padEnd(20)} ${constraintStr}`);
      });

      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`\n  📊 ROWS: ${countResult.rows[0].count}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Schema extraction completed!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getAllTableSchemas();