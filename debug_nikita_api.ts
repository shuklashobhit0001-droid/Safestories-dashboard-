import pool from './lib/db.js';

async function debugNikita() {
  try {
    console.log('Debugging Nikita Jain in /api/clients logic...\n');
    
    // Simulate the exact query from /api/clients
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_resource_name,
        booking_status,
        1 as session_count,
        invitee_created_at as created_at,
        booking_start_at as latest_booking_date,
        booking_invitee_time
      FROM bookings
      
      UNION ALL
      
      SELECT 
        client_name as invitee_name,
        client_whatsapp as invitee_phone,
        client_email as invitee_email,
        therapist_name as booking_host_name,
        therapy_type as booking_resource_name,
        NULL as booking_status,
        0 as session_count,
        created_at,
        created_at as latest_booking_date,
        NULL as booking_invitee_time
      FROM booking_requests
    `);

    // Filter for Nikita
    const nikitaRows = result.rows.filter(r => 
      r.invitee_email && r.invitee_email.toLowerCase().includes('canikitajain14')
    );
    
    console.log(`Found ${nikitaRows.length} rows for Nikita\n`);
    
    // Simulate the grouping logic
    let client = {
      last_session_date: null,
      last_session_date_raw: null
    };
    
    const now = new Date();
    
    nikitaRows.forEach((row, i) => {
      console.log(`\n--- Processing Row ${i + 1} ---`);
      console.log(`booking_invitee_time: ${row.booking_invitee_time}`);
      console.log(`booking_status: ${row.booking_status}`);
      console.log(`latest_booking_date: ${row.latest_booking_date}`);
      
      if (row.booking_status && !['cancelled', 'canceled', 'no_show', 'no show'].includes(row.booking_status)) {
        const sessionDate = new Date(row.latest_booking_date);
        const isPast = sessionDate < now;
        
        console.log(`Session Date: ${sessionDate}`);
        console.log(`Is Past: ${isPast}`);
        console.log(`Has invitee_time: ${!!row.booking_invitee_time}`);
        
        if (isPast && row.booking_invitee_time) {
          console.log(`Current last_session_date_raw: ${client.last_session_date_raw}`);
          
          const shouldUpdate = !client.last_session_date_raw || 
            new Date(row.latest_booking_date) > new Date(client.last_session_date_raw);
          
          console.log(`Should Update: ${shouldUpdate}`);
          
          if (shouldUpdate) {
            client.last_session_date = row.booking_invitee_time;
            client.last_session_date_raw = row.latest_booking_date;
            console.log(`✓ UPDATED to: ${client.last_session_date}`);
          }
        }
      }
    });
    
    console.log(`\n\n=== FINAL RESULT ===`);
    console.log(`last_session_date: ${client.last_session_date}`);
    console.log(`last_session_date_raw: ${client.last_session_date_raw}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugNikita();
