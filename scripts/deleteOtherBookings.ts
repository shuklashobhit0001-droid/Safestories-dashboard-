import pool from '../lib/db';

async function deleteOtherBookings() {
  try {
    const result = await pool.query(`
      DELETE FROM bookings
      WHERE booking_id != '649767'
      RETURNING booking_id;
    `);
    
    console.log(`Deleted ${result.rowCount} bookings`);
    console.log('Kept booking_id: 649767 (Sanjana)');
    
    const remaining = await pool.query('SELECT COUNT(*) FROM bookings;');
    console.log(`\nRemaining bookings in database: ${remaining.rows[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteOtherBookings();
