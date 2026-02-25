import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateIshikaName() {
  const client = await pool.connect();
  
  try {
    console.log('Starting Ishika name update...');
    
    // Update bookings table - booking_host_name
    const bookingsResult = await client.query(`
      UPDATE bookings 
      SET booking_host_name = 'Ishika Mahajan'
      WHERE LOWER(TRIM(booking_host_name)) = 'ishika'
    `);
    console.log(`✅ Updated ${bookingsResult.rowCount} rows in bookings table (booking_host_name)`);
    
    // Update booking_requests table - therapist_name
    const bookingRequestsResult = await client.query(`
      UPDATE booking_requests 
      SET therapist_name = 'Ishika Mahajan'
      WHERE LOWER(TRIM(therapist_name)) = 'ishika'
    `);
    console.log(`✅ Updated ${bookingRequestsResult.rowCount} rows in booking_requests table (therapist_name)`);
    
    // Update users table - first_name and last_name if needed
    const usersResult = await client.query(`
      UPDATE users 
      SET first_name = 'Ishika', last_name = 'Mahajan'
      WHERE LOWER(TRIM(first_name)) = 'ishika' AND (last_name IS NULL OR last_name = '')
    `);
    console.log(`✅ Updated ${usersResult.rowCount} rows in users table`);
    
    console.log('\n✅ Ishika name update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating Ishika name:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateIshikaName()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
