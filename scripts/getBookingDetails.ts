import pool from '../lib/db';

async function getBookingDetails() {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE booking_id = $1',
      ['666687']
    );

    if (result.rows.length === 0) {
      console.log('Booking not found');
      process.exit(1);
    }

    const booking = result.rows[0];
    console.log('\nAll Booking Details for ID 666687:\n');
    
    Object.keys(booking).forEach(key => {
      console.log(`${key}: ${booking[key]}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getBookingDetails();
