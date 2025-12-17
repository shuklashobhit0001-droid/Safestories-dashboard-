import pool from '../lib/db';

async function testAPI() {
  try {
    console.log('Testing database queries...\n');
    
    const revenue = await pool.query(`
      SELECT COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status != 'cancelled'
    `);
    console.log('Revenue:', revenue.rows[0].total);

    const sessions = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status IN ('confirmed', 'rescheduled')
    `);
    console.log('Sessions:', sessions.rows[0].total);

    const freeConsultations = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE invitee_payment_amount = 0 OR invitee_payment_amount IS NULL
    `);
    console.log('Free Consultations:', freeConsultations.rows[0].total);

    const cancelled = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'cancelled'
    `);
    console.log('Cancelled:', cancelled.rows[0].total);

    const refunds = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE refund_status IN ('completed', 'processed')
    `);
    console.log('Refunds:', refunds.rows[0].total);

    const noShows = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'no_show'
    `);
    console.log('No-shows:', noShows.rows[0].total);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAPI();
