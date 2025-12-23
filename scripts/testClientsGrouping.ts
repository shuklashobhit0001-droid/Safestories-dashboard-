import pool from '../lib/db';

async function testClientsGrouping() {
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
    `);

    console.log('Raw data from DB:');
    console.log(JSON.stringify(result.rows, null, 2));

    // Group by unique client (email OR phone)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    result.rows.forEach(row => {
      console.log(`\nProcessing: ${row.invitee_name}, ${row.invitee_phone}, ${row.invitee_email}`);
      
      let key = null;
      
      if (row.invitee_email && emailToKey.has(row.invitee_email)) {
        key = emailToKey.get(row.invitee_email);
        console.log(`Found existing key by email: ${key}`);
      } else if (row.invitee_phone && phoneToKey.has(row.invitee_phone)) {
        key = phoneToKey.get(row.invitee_phone);
        console.log(`Found existing key by phone: ${key}`);
      } else {
        key = `client-${clientMap.size}`;
        console.log(`Creating new key: ${key}`);
        if (row.invitee_email) emailToKey.set(row.invitee_email, key);
        if (row.invitee_phone) phoneToKey.set(row.invitee_phone, key);
      }
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          invitee_name: row.invitee_name,
          invitee_phone: row.invitee_phone,
          invitee_email: row.invitee_email,
          session_count: 0,
          booking_host_name: row.booking_host_name,
          created_at: row.created_at,
          therapists: []
        });
      }
      
      const client = clientMap.get(key);
      client.session_count += parseInt(row.session_count) || 0;
      client.therapists.push({
        booking_host_name: row.booking_host_name,
        session_count: parseInt(row.session_count) || 0
      });
    });

    console.log('\n\nFinal grouped clients:');
    console.log(JSON.stringify(Array.from(clientMap.values()), null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testClientsGrouping();
