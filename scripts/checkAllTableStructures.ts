import pool from '../lib/db';

async function checkAllTableStructures() {
  try {
    const tables = ['all_clients_table', 'appointment_table', 'bookings', 'refund_cancellation_table', 'therapists'];
    
    for (const table of tables) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`TABLE: ${table}`);
      console.log('='.repeat(50));
      
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      
      result.rows.forEach((row) => {
        console.log(`  ${row.column_name} (${row.data_type})`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllTableStructures();
