import pool from '../lib/db';

async function checkBookingRequestData() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        COUNT(*) as session_count
      FROM bookings
      GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name
      
      UNION ALL
      
      SELECT 
        client_name as invitee_name,
        client_whatsapp as invitee_phone,
        client_email as invitee_email,
        therapist_name as booking_host_name,
        0 as session_count
      FROM booking_requests
      
      ORDER BY invitee_name
    `);
    
    console.log('Combined result:');
    console.log(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkBookingRequestData();
