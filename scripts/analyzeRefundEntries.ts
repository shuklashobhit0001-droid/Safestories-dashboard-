import pool from '../lib/db';

async function analyzeRefundEntries() {
  try {
    console.log('=== REFUND ENTRIES ANALYSIS ===\n');
    
    // Get all entries from refund_cancellation_table
    const allEntries = await pool.query(`
      SELECT 
        r.session_id,
        r.client_name,
        r.session_name,
        r.refund_status as refund_table_status,
        b.booking_status,
        b.refund_status as bookings_refund_status
      FROM refund_cancellation_table r
      LEFT JOIN bookings b ON r.session_id = b.booking_id
    `);
    
    console.log(`Total entries in refund_cancellation_table: ${allEntries.rows.length}\n`);
    
    // OLD FILTER (before change)
    const oldFilter = allEntries.rows.filter(row => 
      ['cancelled', 'canceled'].includes(row.booking_status) &&
      row.refund_table_status !== null
    );
    
    // NEW FILTER (after change)
    const newFilter = allEntries.rows.filter(row => 
      ['cancelled', 'canceled'].includes(row.booking_status) &&
      row.bookings_refund_status !== null &&
      ['initiated', 'failed'].includes(row.bookings_refund_status?.toLowerCase())
    );
    
    console.log('OLD FILTER (using refund_table):');
    console.log(`  Entries shown: ${oldFilter.length}\n`);
    oldFilter.forEach(row => {
      console.log(`  - ${row.session_id}: ${row.client_name}`);
      console.log(`    booking_status: ${row.booking_status}`);
      console.log(`    refund_status (refund_table): ${row.refund_table_status}`);
      console.log(`    refund_status (bookings): ${row.bookings_refund_status}\n`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('NEW FILTER (using bookings table):');
    console.log(`  Entries shown: ${newFilter.length}\n`);
    newFilter.forEach(row => {
      console.log(`  - ${row.session_id}: ${row.client_name}`);
      console.log(`    booking_status: ${row.booking_status}`);
      console.log(`    refund_status (bookings): ${row.bookings_refund_status}\n`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Entries that will be HIDDEN after change
    const hidden = oldFilter.filter(old => 
      !newFilter.find(n => n.session_id === old.session_id)
    );
    
    console.log(`ENTRIES THAT WILL BE HIDDEN: ${hidden.length}\n`);
    hidden.forEach(row => {
      console.log(`  ❌ ${row.session_id}: ${row.client_name}`);
      console.log(`     Reason: bookings.refund_status = ${row.bookings_refund_status || 'NULL'}\n`);
    });
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Future test case
    console.log('FUTURE TEST CASE:\n');
    console.log('To make an entry appear in Refunds & Cancellations:');
    console.log('1. Set booking_status = "cancelled" in bookings table');
    console.log('2. Set refund_status = "initiated" OR "failed" in bookings table');
    console.log('3. Entry must exist in refund_cancellation_table\n');
    console.log('Example SQL:');
    console.log('  UPDATE bookings SET booking_status = \'cancelled\', refund_status = \'initiated\' WHERE booking_id = \'123456\'');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeRefundEntries();
