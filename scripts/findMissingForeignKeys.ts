import pool from '../lib/db';

async function findMissingForeignKeys() {
  try {
    // Get all tables and their columns that look like foreign keys
    const result = await pool.query(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND (
          c.column_name LIKE '%_id' 
          OR c.column_name LIKE '%id%'
          OR c.column_name = 'booking_id'
          OR c.column_name = 'therapist_id'
          OR c.column_name = 'client_id'
          OR c.column_name = 'payment_id'
        )
      ORDER BY t.table_name, c.column_name;
    `);

    // Get existing foreign keys
    const fkResult = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `);

    console.log('=== ALL ID COLUMNS ===\n');
    const grouped: any = {};
    result.rows.forEach(row => {
      if (!grouped[row.table_name]) grouped[row.table_name] = [];
      grouped[row.table_name].push(row.column_name);
    });

    Object.keys(grouped).sort().forEach(table => {
      console.log(`${table}:`);
      grouped[table].forEach((col: string) => console.log(`  - ${col}`));
      console.log('');
    });

    console.log('\n=== EXISTING FOREIGN KEYS ===\n');
    fkResult.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

findMissingForeignKeys();
