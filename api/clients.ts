import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    `);

    // Group by unique client (email OR phone)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    result.rows.forEach(row => {
      let key = null;
      
      // Check if we've seen this email or phone before
      if (row.invitee_email && emailToKey.has(row.invitee_email)) {
        key = emailToKey.get(row.invitee_email);
      } else if (row.invitee_phone && phoneToKey.has(row.invitee_phone)) {
        key = phoneToKey.get(row.invitee_phone);
      } else {
        // New client - create unique key
        key = `client-${clientMap.size}`;
      }
      
      // Always map email and phone to this key
      if (row.invitee_email) emailToKey.set(row.invitee_email, key);
      if (row.invitee_phone) phoneToKey.set(row.invitee_phone, key);
      
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
        invitee_name: row.invitee_name,
        invitee_phone: row.invitee_phone,
        booking_host_name: row.booking_host_name,
        session_count: parseInt(row.session_count) || 0
      });
    });

    const clients = Array.from(clientMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
}
