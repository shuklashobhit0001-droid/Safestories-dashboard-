import pool from '../lib/db';

async function testClientsAPI() {
  try {
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        COUNT(*) as session_count,
        MAX(invitee_created_at) as created_at
      FROM bookings
      GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name
      
      UNION ALL
      
      SELECT 
        client_name as invitee_name,
        client_whatsapp as invitee_phone,
        client_email as invitee_email,
        therapist_name as booking_host_name,
        0 as session_count,
        created_at
      FROM booking_requests
      
      ORDER BY created_at DESC NULLS LAST
    `);

    console.log('Query results:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.invitee_name} - ${row.created_at}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testClientsAPI();
