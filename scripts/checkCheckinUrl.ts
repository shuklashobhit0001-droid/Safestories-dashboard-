import pool from '../lib/db';

async function checkCheckinUrl() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        booking_checkin_url,
        booking_joining_link
      FROM bookings 
      WHERE invitee_name ILIKE '%sanjana%'
      LIMIT 1
    `);
    
    console.log('\n=== Sanjana Checkin URL ===');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCheckinUrl();
