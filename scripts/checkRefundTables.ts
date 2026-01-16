import pool from '../lib/db';

async function checkRefundTables() {
  try {
    console.log('🔍 Checking refund_cancellation_table...\n');
    
    const refundTable = await pool.query('SELECT * FROM refund_cancellation_table ORDER BY created_at DESC');
    console.log(`📊 refund_cancellation_table: ${refundTable.rows.length} rows\n`);
    
    if (refundTable.rows.length > 0) {
      console.log('Columns:', Object.keys(refundTable.rows[0]).join(', '));
      console.log('\nData:');
      refundTable.rows.forEach((row, i) => {
        console.log(`\n${i + 1}.`, JSON.stringify(row, null, 2));
      });
    }

    console.log('\n' + '='.repeat(100) + '\n');
    console.log('🔍 Checking booking_cancelled table...\n');
    
    const cancelledTable = await pool.query('SELECT * FROM booking_cancelled ORDER BY cancelled_at DESC');
    console.log(`📊 booking_cancelled: ${cancelledTable.rows.length} rows\n`);
    
    if (cancelledTable.rows.length > 0) {
      console.log('Columns:', Object.keys(cancelledTable.rows[0]).join(', '));
      console.log('\nData:');
      cancelledTable.rows.forEach((row, i) => {
        console.log(`\n${i + 1}.`, JSON.stringify(row, null, 2));
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRefundTables();
