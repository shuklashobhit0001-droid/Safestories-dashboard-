import pool from '../lib/db';

async function clearBookingRequests() {
  try {
    console.log('Clearing all data from booking_requests table...');
    
    const result = await pool.query('DELETE FROM booking_requests');
    
    console.log(`✅ Successfully deleted ${result.rowCount} rows from booking_requests table`);
    
    await pool.end();
  } catch (error) {
    console.error('Error clearing booking_requests:', error);
    process.exit(1);
  }
}

clearBookingRequests();
