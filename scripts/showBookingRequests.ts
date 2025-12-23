import pool from '../lib/db';

async function showBookingRequests() {
  try {
    const result = await pool.query('SELECT * FROM booking_requests');
    
    console.log(`\nTotal rows in booking_requests: ${result.rowCount}\n`);
    
    if (result.rowCount > 0) {
      console.log('Data:');
      console.log(JSON.stringify(result.rows, null, 2));
    } else {
      console.log('Table is empty');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

showBookingRequests();
