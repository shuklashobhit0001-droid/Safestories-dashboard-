import pool from '../lib/db';

async function checkRefundTables() {
  try {
    // Check refund_cancellation_table structure
    console.log('🔍 refund_cancellation_table structure:\n');
    const refundStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'refund_cancellation_table' 
      ORDER BY ordinal_position;
    `);
    refundStructure.rows.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    
    const refundData = await pool.query('SELECT * FROM refund_cancellation_table LIMIT 10');
    console.log(`\n📊 Data: ${refundData.rows.length} rows\n`);
    refundData.rows.forEach((row, i) => console.log(`${i + 1}.`, row));

    console.log('\n' + '='.repeat(100) + '\n');

    // Check booking_cancelled structure
    console.log('🔍 booking_cancelled structure:\n');
    const cancelStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'booking_cancelled' 
      ORDER BY ordinal_position;
    `);
    cancelStructure.rows.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    
    const cancelData = await pool.query('SELECT * FROM booking_cancelled LIMIT 10');
    console.log(`\n📊 Data: ${cancelData.rows.length} rows\n`);
    cancelData.rows.forEach((row, i) => console.log(`${i + 1}.`, row));

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRefundTables();
