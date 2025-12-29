import pool from '../lib/db.js';

async function testTherapistClientsAPI() {
  try {
    // Get Ishika's therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE role = $1 LIMIT 1',
      ['therapist']
    );

    if (userResult.rows.length === 0) {
      console.log('No therapist found');
      return;
    }

    const therapistUserId = userResult.rows[0].therapist_id;
    console.log('Therapist ID:', therapistUserId);

    // Get raw data from table
    const clientsResult = await pool.query(
      'SELECT * FROM therapist_clients_summary WHERE therapist_id = $1 ORDER BY last_session_date DESC',
      [therapistUserId]
    );

    console.log('\n=== RAW DATA FROM TABLE ===');
    console.log('Total rows:', clientsResult.rows.length);
    clientsResult.rows.forEach((row, i) => {
      console.log(`\nRow ${i + 1}:`, {
        name: row.client_name,
        phone: row.client_phone,
        email: row.client_email,
        sessions: row.total_sessions
      });
    });

    // Test deduplication logic
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    clientsResult.rows.forEach((row, index) => {
      console.log(`\n--- Processing row ${index + 1} ---`);
      console.log('Email:', row.client_email, 'Phone:', row.client_phone);
      
      let key = null;
      
      if (row.client_email && emailToKey.has(row.client_email)) {
        key = emailToKey.get(row.client_email);
        console.log('Found existing key by email:', key);
      } else if (row.client_phone && phoneToKey.has(row.client_phone)) {
        key = phoneToKey.get(row.client_phone);
        console.log('Found existing key by phone:', key);
      } else {
        key = `client-${clientMap.size}`;
        console.log('Created new key:', key);
      }
      
      if (row.client_email) {
        emailToKey.set(row.client_email, key);
        console.log('Mapped email to key:', row.client_email, '->', key);
      }
      if (row.client_phone) {
        phoneToKey.set(row.client_phone, key);
        console.log('Mapped phone to key:', row.client_phone, '->', key);
      }
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          client_name: row.client_name,
          client_phone: row.client_phone,
          client_email: row.client_email,
          total_sessions: 0,
          therapists: []
        });
        console.log('Created new client entry');
      }
      
      const client = clientMap.get(key);
      client.total_sessions += parseInt(row.total_sessions) || 0;
      client.therapists.push({
        client_name: row.client_name,
        client_phone: row.client_phone,
        total_sessions: parseInt(row.total_sessions) || 0
      });
      console.log('Updated sessions to:', client.total_sessions);
    });

    const clients = Array.from(clientMap.values());

    console.log('\n=== FINAL DEDUPLICATED RESULT ===');
    console.log('Total unique clients:', clients.length);
    clients.forEach((client, i) => {
      console.log(`\nClient ${i + 1}:`, {
        name: client.client_name,
        phone: client.client_phone,
        email: client.client_email,
        total_sessions: client.total_sessions,
        therapist_entries: client.therapists.length
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testTherapistClientsAPI();
