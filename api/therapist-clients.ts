import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { therapist_id } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    // Get user info to find therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist user not found' });
    }

    const therapistUserId = userResult.rows[0].therapist_id;

    // Get clients for this therapist from dedicated table
    const clientsResult = await pool.query(
      'SELECT * FROM therapist_clients_summary WHERE therapist_id = $1 ORDER BY last_session_date DESC',
      [therapistUserId]
    );

    // Group by unique client (prioritize email, fallback to phone)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    clientsResult.rows.forEach(row => {
      let key = null;
      
      // Prioritize email for matching
      if (row.client_email && emailToKey.has(row.client_email)) {
        key = emailToKey.get(row.client_email);
      } else if (row.client_phone && phoneToKey.has(row.client_phone)) {
        key = phoneToKey.get(row.client_phone);
      } else {
        key = `client-${clientMap.size}`;
      }
      
      // Map both email and phone to the same key
      if (row.client_email) emailToKey.set(row.client_email, key);
      if (row.client_phone) phoneToKey.set(row.client_phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          client_name: row.client_name,
          client_phone: row.client_phone,
          client_email: row.client_email,
          total_sessions: 0,
          therapists: []
        });
      }
      
      const client = clientMap.get(key);
      client.total_sessions += parseInt(row.total_sessions) || 0;
      client.therapists.push({
        client_name: row.client_name,
        client_phone: row.client_phone,
        total_sessions: parseInt(row.total_sessions) || 0
      });
    });

    const clients = Array.from(clientMap.values());

    res.json({ clients });

  } catch (error) {
    console.error('Therapist clients error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist clients' });
  }
}