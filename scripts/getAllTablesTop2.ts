import pool from '../lib/db';

async function getAllTablesTop2() {
  const { rows: tables } = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );

  console.log(`Found ${tables.length} tables\n`);

  for (const { tablename } of tables) {
    console.log(`\n=== TABLE: ${tablename} ===`);
    const { rows } = await pool.query(`SELECT * FROM ${tablename} LIMIT 2`);
    console.log(`Records: ${rows.length}`);
    if (rows.length > 0) {
      console.log(JSON.stringify(rows, null, 2));
    }
  }

  await pool.end();
}

getAllTablesTop2().catch(console.error);
