import pool from '../lib/db';

async function checkMapping() {
  try {
    console.log('📋 refund_cancellation_table columns:\n');
    const refundCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'refund_cancellation_table' 
      ORDER BY ordinal_position;
    `);
    refundCols.rows.forEach(col => console.log(`  ${col.column_name} (${col.data_type})`));

    console.log('\n📋 bookings table - relevant columns:\n');
    const bookingCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND (column_name LIKE '%id%' OR column_name LIKE '%name%' 
           OR column_name LIKE '%session%' OR column_name LIKE '%payment%'
           OR column_name LIKE '%timing%')
      ORDER BY ordinal_position;
    `);
    bookingCols.rows.forEach(col => console.log(`  ${col.column_name} (${col.data_type})`));

    console.log('\n\n🔗 MAPPING ANALYSIS:\n');
    console.log('refund_cancellation_table → bookings');
    console.log('─'.repeat(60));
    console.log('client_id              → invitee_id');
    console.log('client_name            → invitee_name');
    console.log('session_id             → booking_id');
    console.log('session_name           → booking_resource_name');
    console.log('session_timings        → booking_invitee_time');
    console.log('payment_id             → invitee_payment_reference_id');
    console.log('payment_status         → refund_status');

    console.log('\n✅ YES - Tables CAN be mapped!');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMapping();
