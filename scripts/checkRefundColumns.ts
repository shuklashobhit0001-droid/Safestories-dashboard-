import pool from '../lib/db';

async function checkTableStructure() {
  try {
    console.log('🔍 Checking bookings table structure for refund columns...\n');

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      AND (column_name LIKE '%refund%' OR column_name LIKE '%cancel%' OR column_name LIKE '%payment%')
      ORDER BY ordinal_position;
    `);

    console.log('📋 Refund/Cancel/Payment Related Columns:\n');
    console.log('='.repeat(100));
    
    result.rows.forEach((row) => {
      console.log(`\nColumn: ${row.column_name}`);
      console.log(`  Type: ${row.data_type}`);
      console.log(`  Nullable: ${row.is_nullable}`);
      console.log(`  Default: ${row.column_default || 'None'}`);
      console.log('-'.repeat(100));
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTableStructure();
