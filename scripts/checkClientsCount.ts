import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Same query as API
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        1 as session_count,
        invitee_created_at as created_at,
        booking_start_at as latest_booking_date
      FROM bookings
      
      UNION ALL
      
      SELECT 
        client_name as invitee_name,
        client_whatsapp as invitee_phone,
        client_email as invitee_email,
        therapist_name as booking_host_name,
        0 as session_count,
        created_at,
        created_at as latest_booking_date
      FROM booking_requests
    `);

    console.log('Total raw records (bookings + booking_requests):', result.rows.length);
    
    // Group by unique client (same logic as API)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    result.rows.forEach(row => {
      let key = null;
      
      if (row.invitee_email && emailToKey.has(row.invitee_email)) {
        key = emailToKey.get(row.invitee_email);
      } else if (row.invitee_phone && phoneToKey.has(row.invitee_phone)) {
        key = phoneToKey.get(row.invitee_phone);
      } else {
        key = `client-${clientMap.size}`;
      }
      
      if (row.invitee_email) emailToKey.set(row.invitee_email, key);
      if (row.invitee_phone) phoneToKey.set(row.invitee_phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          invitee_name: row.invitee_name,
          invitee_phone: row.invitee_phone,
          invitee_email: row.invitee_email,
          session_count: 0,
          booking_host_name: row.booking_host_name,
          created_at: row.created_at
        });
      }
      
      const client = clientMap.get(key);
      client.session_count += parseInt(row.session_count) || 0;
    });

    const clients = Array.from(clientMap.values());
    
    console.log('\n=== UNIQUE CLIENTS IN ADMIN DASHBOARD ===');
    console.log('Total unique clients:', clients.length);
    console.log('\n');
    
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.invitee_name} - ${client.invitee_phone} - Sessions: ${client.session_count}`);
    });
    
    // Check which are from booking_requests only (0 sessions)
    const bookingRequestsOnly = clients.filter(c => c.session_count === 0);
    console.log('\n=== CLIENTS FROM BOOKING_REQUESTS ONLY (0 sessions) ===');
    console.log('Count:', bookingRequestsOnly.length);
    bookingRequestsOnly.forEach((client, index) => {
      console.log(`${index + 1}. ${client.invitee_name} - ${client.invitee_phone}`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
