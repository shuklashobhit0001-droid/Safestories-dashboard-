import pool from '../lib/db';

async function checkRefundsInBookings() {
  try {
    const refunds = await pool.query('SELECT session_id FROM refund_cancellation_table');
    console.log('Session IDs in refund_cancellation_table:', refunds.rows.map(r => r.session_id));
    
    const bookings = await pool.query('SELECT booking_id FROM bookings WHERE booking_id = ANY($1)', 
      [refunds.rows.map(r => r.session_id)]);
    
    console.log('\nMatching booking_ids in bookings table:', bookings.rows.map(b => b.booking_id));
    console.log('\nTotal refund entries:', refunds.rows.length);
    console.log('Matching bookings found:', bookings.rows.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRefundsInBookings();
