import pool from '../lib/db';

async function checkOrphanedTablesConnections() {
  try {
    console.log('=== CHECKING CONNECTIONS FOR ORPHANED TABLES ===\n');

    // Check all foreign keys involving these two tables
    const fks = await pool.query(`
      SELECT
        tc.table_name as child_table,
        kcu.column_name as child_column,
        ccu.table_name AS parent_table,
        ccu.column_name AS parent_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND (tc.table_name IN ('client_session_notes', 'therapist_resources')
             OR ccu.table_name IN ('client_session_notes', 'therapist_resources'))
      ORDER BY tc.table_name;
    `);

    console.log('Foreign keys involving client_session_notes or therapist_resources:');
    if (fks.rows.length === 0) {
      console.log('❌ NONE - Both tables have NO foreign key connections\n');
    } else {
      fks.rows.forEach(row => {
        console.log(`  ${row.child_table}.${row.child_column} → ${row.parent_table}.${row.parent_column}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrphanedTablesConnections();
