import pool from '../lib/db';

async function checkRefundsData() {
  try {
    console.log('🔍 Checking refunds and cancellations data...\n');

    // Query all cancelled bookings with refund information
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name as client_name,
        booking_resource_name as session_name,
        booking_invitee_time as session_timings,
        booking_status,
        COALESCE(refund_status, 'Pending') as refund_status,
        invitee_phone,
        invitee_email,
        refund_amount,
        invitee_cancelled_at,
        invitee_payment_amount
      FROM bookings
      WHERE booking_status IN ('cancelled', 'canceled')
      ORDER BY invitee_cancelled_at DESC
    `);

    console.log(`📊 Total cancelled bookings: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('✅ No cancelled bookings found.');
    } else {
      console.log('📋 Cancelled Bookings Data:\n');
      console.log('='.repeat(120));
      
      result.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Booking ID: ${row.booking_id}`);
        console.log(`   Client: ${row.client_name}`);
        console.log(`   Phone: ${row.invitee_phone || 'N/A'}`);
        console.log(`   Email: ${row.invitee_email || 'N/A'}`);
        console.log(`   Session: ${row.session_name}`);
        console.log(`   Session Time: ${row.session_timings || 'N/A'}`);
        console.log(`   Payment Amount: ₹${row.invitee_payment_amount || 0}`);
        console.log(`   Refund Status: ${row.refund_status}`);
        console.log(`   Refund Amount: ₹${row.refund_amount || 0}`);
        console.log(`   Cancelled At: ${row.invitee_cancelled_at || 'N/A'}`);
        console.log('-'.repeat(120));
      });

      // Summary by refund status
      console.log('\n\n📈 Summary by Refund Status:\n');
      const statusCounts = result.rows.reduce((acc: any, row) => {
        const status = row.refund_status || 'Pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRefundsData();
