import express from 'express';
import cors from 'cors';
import pool from '../lib/db';
import { convertToIST } from '../lib/timezone';

// Helper function to get current IST timestamp as formatted string
const getCurrentISTTimestamp = () => {
  const now = new Date();
  const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' IST';
};

const app = express();
app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Log therapist login
      if (user.role === 'therapist') {
        try {
          await pool.query(
            `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, timestamp, is_visible)
             VALUES ($1, $2, $3, $4, $5, true)`,
            [user.therapist_id, username, 'login', `${username} logged into dashboard`, getCurrentISTTimestamp()]
          );
          console.log('✅ Audit log created for login:', username, user.therapist_id);
        } catch (auditError) {
          console.error('❌ Failed to create audit log for login:', auditError);
        }
      }
      
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const { start, end } = req.query;
    const hasDateFilter = start && end;
    
    // Calculate last month date range
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const revenue = hasDateFilter
      ? await pool.query(
          'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['cancelled', 'canceled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2)',
          ['cancelled', 'canceled']
        );

    const sessions = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['confirmed', 'rescheduled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)',
          ['confirmed', 'rescheduled']
        );

    const freeConsultations = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)'
        );

    const cancelled = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['cancelled', 'canceled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)',
          ['cancelled', 'canceled']
        );

    const refunds = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL'
        );

    const refundedAmount = hasDateFilter
      ? await pool.query(
          'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL'
        );

    const noShows = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status = $1 AND booking_start_at BETWEEN $2 AND $3',
          ['no_show', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status = $1',
          ['no_show']
        );

    const lastMonthSessions = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['confirmed', 'rescheduled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthFreeConsultations = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
      [lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthCancelled = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthRefunds = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE refund_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['completed', 'processed', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthNoShows = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status = $1 AND booking_start_at BETWEEN $2 AND $3',
      ['no_show', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    res.json({
      revenue: revenue.rows[0].total,
      refundedAmount: refundedAmount.rows[0].total,
      sessions: sessions.rows[0].total,
      lastMonthSessions: lastMonthSessions.rows[0].total,
      freeConsultations: freeConsultations.rows[0].total,
      lastMonthFreeConsultations: lastMonthFreeConsultations.rows[0].total,
      cancelled: cancelled.rows[0].total,
      lastMonthCancelled: lastMonthCancelled.rows[0].total,
      refunds: refunds.rows[0].total,
      lastMonthRefunds: lastMonthRefunds.rows[0].total,
      noShows: noShows.rows[0].total,
      lastMonthNoShows: lastMonthNoShows.rows[0].total,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get upcoming bookings
app.get('/api/dashboard/bookings', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const result = start && end
      ? await pool.query(
          `SELECT 
            invitee_name as client_name,
            booking_resource_name as therapy_type,
            booking_mode as mode,
            booking_host_name as therapist_name,
            booking_invitee_time
          FROM bookings
          WHERE booking_status NOT IN ($1, $2)
            AND booking_start_at BETWEEN $3 AND $4
          ORDER BY booking_start_at ASC
          LIMIT 10`,
          ['cancelled', 'canceled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          `SELECT 
            invitee_name as client_name,
            booking_resource_name as therapy_type,
            booking_mode as mode,
            booking_host_name as therapist_name,
            booking_invitee_time
          FROM bookings
          WHERE booking_status NOT IN ($1, $2)
            AND booking_start_at >= CURRENT_DATE
          ORDER BY booking_start_at ASC
          LIMIT 10`,
          ['cancelled', 'canceled']
        );

    const bookings = result.rows.map(row => ({
      ...row,
      booking_start_at: row.booking_invitee_time || 'N/A',
      mode: row.mode ? row.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet'
    }));

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get all clients
app.get('/api/clients', async (req, res) => {
  try {
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

    // Group by email (primary) or phone (fallback)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    result.rows.forEach(row => {
      const email = row.invitee_email ? row.invitee_email.toLowerCase().trim() : null;
      const phone = row.invitee_phone ? row.invitee_phone.replace(/[\s\-\(\)\+]/g, '') : null;
      
      let key = null;
      
      // Find existing key by email or phone
      if (email && emailToKey.has(email)) {
        key = emailToKey.get(email);
      } else if (phone && phoneToKey.has(phone)) {
        key = phoneToKey.get(phone);
        // If we now have an email for this phone-based entry, upgrade the key
        if (email) {
          const oldData = clientMap.get(key);
          clientMap.delete(key);
          key = email;
          clientMap.set(key, oldData);
          emailToKey.set(email, key);
        }
      } else {
        // New client
        key = email || phone;
      }
      
      if (!key) return;
      
      // Track mappings
      if (email) emailToKey.set(email, key);
      if (phone) phoneToKey.set(phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          invitee_name: row.invitee_name,
          invitee_phone: row.invitee_phone,
          invitee_email: row.invitee_email,
          session_count: 0,
          booking_host_name: row.booking_host_name,
          created_at: row.created_at,
          latest_booking_date: row.latest_booking_date,
          therapists: []
        });
      }
      
      const client = clientMap.get(key);
      client.session_count += parseInt(row.session_count) || 0;
      
      // Update to most recent phone number and therapist
      if (new Date(row.latest_booking_date) > new Date(client.latest_booking_date)) {
        client.latest_booking_date = row.latest_booking_date;
        client.invitee_phone = row.invitee_phone;
        if (parseInt(row.session_count) > 0) {
          client.booking_host_name = row.booking_host_name;
        }
      }
      
      // Fill in missing email if found
      if (row.invitee_email && !client.invitee_email) {
        client.invitee_email = row.invitee_email;
      }
      
      // Add to therapists array only if different therapist
      if (parseInt(row.session_count) > 0) {
        const existing = client.therapists.find((t: any) => 
          t.booking_host_name === row.booking_host_name
        );
        
        if (existing) {
          existing.session_count += parseInt(row.session_count) || 0;
        } else {
          client.therapists.push({
            invitee_name: row.invitee_name,
            invitee_phone: row.invitee_phone,
            booking_host_name: row.booking_host_name,
            session_count: parseInt(row.session_count) || 0
          });
        }
      }
    });

    const clients = Array.from(clientMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_invitee_time,
        b.booking_resource_name,
        b.invitee_name,
        b.invitee_phone,
        b.invitee_email,
        b.booking_host_name,
        b.booking_mode,
        b.booking_start_at,
        b.booking_joining_link,
        b.booking_checkin_url,
        b.therapist_id,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      ORDER BY b.booking_start_at DESC
    `);

    const appointments = result.rows.map(row => {
      let status = row.booking_status;
      const now = new Date();
      const sessionDate = new Date(row.booking_start_at);
      
      if (row.booking_status !== 'cancelled' && row.booking_status !== 'no_show') {
        if (row.has_session_notes) {
          status = 'completed';
        } else if (sessionDate < now) {
          status = 'pending_notes';
        }
      }
      
      return {
        booking_id: row.booking_id,
        booking_start_at: row.booking_invitee_time || 'N/A',
        booking_resource_name: row.booking_resource_name,
        invitee_name: row.invitee_name,
        invitee_phone: row.invitee_phone,
        invitee_email: row.invitee_email,
        booking_host_name: row.booking_host_name,
        booking_mode: row.booking_mode ? row.booking_mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet',
        booking_joining_link: row.booking_joining_link,
        booking_checkin_url: row.booking_checkin_url,
        therapist_id: row.therapist_id,
        has_session_notes: row.has_session_notes,
        booking_status: status,
        booking_start_at_raw: row.booking_start_at
      };
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get therapies
app.get('/api/therapies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT specialization
      FROM therapists
      WHERE specialization IS NOT NULL
    `);

    const therapySet = new Set<string>();
    result.rows.forEach(row => {
      const specializations = row.specialization.split(',').map((s: string) => s.trim());
      specializations.forEach((spec: string) => therapySet.add(spec));
    });

    const therapies = Array.from(therapySet).sort().map(therapy => ({ therapy_name: therapy }));
    res.json(therapies);
  } catch (error) {
    console.error('Error fetching therapies:', error);
    res.status(500).json({ error: 'Failed to fetch therapies' });
  }
});

// Save booking request
app.post('/api/booking-requests', async (req, res) => {
  try {
    const { clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation, adminId } = req.body;

    const result = await pool.query(
      `INSERT INTO booking_requests (client_name, client_whatsapp, client_email, therapy_type, therapist_name, booking_link, status, is_free_consultation)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7)
       RETURNING *`,
      [clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation || false]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error saving booking request:', error);
    res.status(500).json({ success: false, error: 'Failed to save booking request' });
  }
});

// Get all therapists
app.get('/api/therapists', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.therapist_id,
        t.name,
        t.specialization,
        t.contact_info,
        COUNT(DISTINCT b.booking_id) as total_sessions_lifetime,
        COUNT(DISTINCT CASE 
          WHEN EXTRACT(MONTH FROM b.booking_start_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM b.booking_start_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN b.booking_id 
        END) as sessions_this_month,
        COALESCE(SUM(b.invitee_payment_amount), 0) as total_revenue,
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM b.booking_start_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM b.booking_start_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN b.invitee_payment_amount 
          ELSE 0 
        END), 0) as revenue_this_month
      FROM therapists t
      LEFT JOIN bookings b ON (
        TRIM(b.booking_host_name) ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
        OR TRIM(b.booking_host_name) ILIKE t.name
      )
      GROUP BY t.therapist_id, t.name, t.specialization, t.contact_info
      ORDER BY t.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// Get therapist details
app.get('/api/therapist-details', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Therapist name is required' });
    }

    // Get unique clients for this therapist (grouped by email OR phone)
    const clientsResult = await pool.query(`
      WITH client_data AS (
        SELECT DISTINCT 
          invitee_name,
          invitee_email,
          invitee_phone
        FROM bookings
        WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
      )
      SELECT 
        invitee_name,
        invitee_email,
        STRING_AGG(DISTINCT invitee_phone, ', ') as invitee_phone
      FROM client_data
      GROUP BY invitee_name, invitee_email
      ORDER BY invitee_name
    `, [name]);

    // Get recent appointments for this therapist
    const appointmentsResult = await pool.query(`
      SELECT 
        invitee_name,
        booking_resource_name,
        booking_start_at,
        booking_invitee_time
      FROM bookings
      WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
      ORDER BY booking_start_at DESC
      LIMIT 10
    `, [name]);

    const appointments = appointmentsResult.rows.map(apt => ({
      ...apt,
      booking_invitee_time: convertToIST(apt.booking_invitee_time)
    }));

    res.json({
      clients: clientsResult.rows,
      appointments
    });
  } catch (error) {
    console.error('Error fetching therapist details:', error);
    res.status(500).json({ error: 'Failed to fetch therapist details' });
  }
});

// Get client details
app.get('/api/client-details', async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Client email or phone is required' });
    }

    let query = `
      SELECT 
        invitee_name,
        booking_resource_name,
        booking_start_at,
        booking_invitee_time,
        booking_host_name
      FROM bookings
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (email) {
      params.push(email);
      query += ` AND invitee_email = $${params.length}`;
    }
    
    if (phone) {
      params.push(phone);
      query += ` AND invitee_phone = $${params.length}`;
    }
    
    query += ' ORDER BY booking_start_at DESC';

    const appointmentsResult = await pool.query(query, params);

    const appointments = appointmentsResult.rows.map(apt => ({
      ...apt,
      booking_invitee_time: convertToIST(apt.booking_invitee_time)
    }));

    res.json({
      appointments
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});

// Get therapist stats
app.get('/api/therapist-stats', async (req, res) => {
  try {
    const { therapist_id, start, end } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    // Get user info to find therapist_id
    const userResult = await pool.query(
      'SELECT therapist_id, username FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist user not found' });
    }

    const therapistUserId = userResult.rows[0].therapist_id;
    const therapistUsername = userResult.rows[0].username;

    // Get therapist info
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    const therapist = therapistResult.rows[0] || { name: 'Ishika Mahajan', specialization: 'Individual Therapy' };
    const therapistFirstName = therapist.name.split(' ')[0];

    const hasDateFilter = start && end;

    // Calculate last month date range
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get stats from bookings table with date filter using therapist name
    const sessions = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
          [`%${therapistFirstName}%`, 'confirmed', 'rescheduled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3)',
          [`%${therapistFirstName}%`, 'confirmed', 'rescheduled']
        );

    const noShows = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
          [`%${therapistFirstName}%`, 'no_show', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2',
          [`%${therapistFirstName}%`, 'no_show']
        );

    const cancelled = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
          [`%${therapistFirstName}%`, 'cancelled', 'canceled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3)',
          [`%${therapistFirstName}%`, 'cancelled', 'canceled']
        );

    const lastMonthSessions = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
      [`%${therapistFirstName}%`, 'confirmed', 'rescheduled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthNoShows = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
      [`%${therapistFirstName}%`, 'no_show', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    const lastMonthCancelled = await pool.query(
      'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
      [`%${therapistFirstName}%`, 'cancelled', 'canceled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    // Get upcoming bookings directly from bookings table
    const upcomingResult = await pool.query(`
      SELECT 
        booking_id,
        invitee_name as client_name,
        booking_resource_name as session_name,
        booking_mode as mode,
        booking_invitee_time as session_timings,
        booking_start_at as booking_date
      FROM bookings
      WHERE booking_host_name ILIKE $1
        AND booking_start_at >= CURRENT_DATE
        AND booking_status NOT IN ('cancelled', 'canceled')
      ORDER BY booking_start_at ASC
      LIMIT 10
    `, [`%${therapistFirstName}%`]);

    res.json({
      therapist: {
        name: therapist.name,
        specialization: therapist.specialization
      },
      stats: {
        sessions: parseInt(sessions.rows[0].total) || 0,
        noShows: parseInt(noShows.rows[0].total) || 0,
        cancelled: parseInt(cancelled.rows[0].total) || 0,
        lastMonthSessions: parseInt(lastMonthSessions.rows[0].total) || 0,
        lastMonthNoShows: parseInt(lastMonthNoShows.rows[0].total) || 0,
        lastMonthCancelled: parseInt(lastMonthCancelled.rows[0].total) || 0
      },
      upcomingBookings: upcomingResult.rows.map(booking => ({
        booking_id: booking.booking_id,
        client_name: booking.client_name,
        therapy_type: booking.session_name,
        mode: booking.mode?.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Google Meet',
        session_timings: convertToIST(booking.session_timings)
      }))
    });

  } catch (error) {
    console.error('Therapist stats error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist stats' });
  }
});

// Get therapist appointments
app.get('/api/therapist-appointments', async (req, res) => {
  try {
    const { therapist_id } = req.query;

    if (!therapist_id) {
      return res.status(400).json({ error: 'Therapist ID is required' });
    }

    const userResult = await pool.query(
      'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
      [therapist_id, 'therapist']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist user not found' });
    }

    const therapistUserId = userResult.rows[0].therapist_id;
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    const therapist = therapistResult.rows[0];
    const therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';

    const appointmentsResult = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name as client_name,
        b.invitee_phone as contact_info,
        b.booking_resource_name as session_name,
        b.booking_invitee_time as session_timings,
        b.booking_mode as mode,
        b.booking_start_at as booking_date,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE b.booking_host_name ILIKE $1
      ORDER BY b.booking_start_at DESC
    `, [`%${therapistFirstName}%`]);

    const appointments = appointmentsResult.rows.map(apt => ({
      ...apt,
      session_timings: convertToIST(apt.session_timings),
      mode: apt.mode?.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Google Meet'
    }));

    res.json({ appointments });
  } catch (error) {
    console.error('Therapist appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist appointments' });
  }
});

// Get therapist clients
app.get('/api/therapist-clients', async (req, res) => {
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

    // Get therapist info to get the name
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [therapistUserId]
    );

    const therapist = therapistResult.rows[0];
    const therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';

    // Get clients for this therapist directly from bookings table
    const clientsResult = await pool.query(`
      SELECT 
        invitee_name as client_name,
        invitee_email as client_email,
        invitee_phone as client_phone,
        booking_start_at,
        COUNT(*) as total_sessions
      FROM bookings
      WHERE booking_host_name ILIKE $1
      GROUP BY invitee_name, invitee_email, invitee_phone, booking_start_at
      ORDER BY booking_start_at DESC
    `, [`%${therapistFirstName}%`]);

    // Group by email (primary) or phone (fallback)
    const clientMap = new Map();
    
    clientsResult.rows.forEach(row => {
      const email = row.client_email ? row.client_email.toLowerCase().trim() : null;
      const phone = row.client_phone ? row.client_phone.replace(/[\s\-\(\)\+]/g, '') : null;
      
      // Use email as key if available, otherwise use phone
      const key = email || phone;
      if (!key) return; // Skip if both are missing
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          client_name: row.client_name,
          client_phone: row.client_phone,
          client_email: row.client_email,
          total_sessions: 0,
          latest_booking_date: row.booking_start_at
        });
      }
      
      const client = clientMap.get(key);
      client.total_sessions += parseInt(row.total_sessions) || 0;
      
      // Update to most recent phone number
      if (new Date(row.booking_start_at) > new Date(client.latest_booking_date)) {
        client.latest_booking_date = row.booking_start_at;
        client.client_phone = row.client_phone;
      }
      
      // Fill in missing email if found
      if (row.client_email && !client.client_email) {
        client.client_email = row.client_email;
      }
    });

    const clients = Array.from(clientMap.values()).map(({ latest_booking_date, ...client }) => client);

    res.json({ clients });

  } catch (error) {
    console.error('Therapist clients error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist clients' });
  }
});

// Get client appointments
app.get('/api/client-appointments', async (req, res) => {
  try {
    const { client_phone, therapist_id } = req.query;

    if (!client_phone) {
      return res.status(400).json({ error: 'Client phone is required' });
    }

    // Get therapist info
    let therapistFirstName = '';
    if (therapist_id) {
      const userResult = await pool.query(
        'SELECT therapist_id FROM users WHERE id = $1 AND role = $2',
        [therapist_id, 'therapist']
      );

      if (userResult.rows.length > 0) {
        const therapistUserId = userResult.rows[0].therapist_id;
        const therapistResult = await pool.query(
          'SELECT * FROM therapists WHERE therapist_id = $1',
          [therapistUserId]
        );

        const therapist = therapistResult.rows[0];
        therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';
      }
    }

    // Query with or without therapist filter
    const query = therapistFirstName
      ? `SELECT 
          b.booking_id,
          b.booking_invitee_time as session_timings,
          b.booking_mode as mode,
          b.booking_start_at as booking_date,
          b.booking_status,
          CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
        FROM bookings b
        LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
        WHERE b.invitee_phone = $1
          AND b.booking_host_name ILIKE $2
        ORDER BY b.booking_start_at DESC`
      : `SELECT 
          b.booking_id,
          b.booking_invitee_time as session_timings,
          b.booking_mode as mode,
          b.booking_start_at as booking_date,
          b.booking_status,
          CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
        FROM bookings b
        LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
        WHERE b.invitee_phone = $1
        ORDER BY b.booking_start_at DESC`;

    const params = therapistFirstName ? [client_phone, `%${therapistFirstName}%`] : [client_phone];
    const appointmentsResult = await pool.query(query, params);

    const appointments = appointmentsResult.rows.map(row => ({
      booking_id: row.booking_id,
      session_timings: row.session_timings || 'N/A',
      mode: row.mode ? row.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet',
      has_session_notes: row.has_session_notes,
      booking_status: row.booking_status
    }));

    res.json({ appointments });
  } catch (error) {
    console.error('Client appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch client appointments' });
  }
});

// Transfer client endpoint
app.post('/api/transfer-client', async (req, res) => {
  console.log('Transfer client API called');
  
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      fromTherapistName,
      toTherapistId,
      transferredByAdminId,
      transferredByAdminName,
      reason
    } = req.body;

    console.log('Transfer data:', { clientName, fromTherapistName, toTherapistId });

    // Get new therapist details
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [toTherapistId]
    );

    if (therapistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }

    const newTherapist = therapistResult.rows[0];

    // Get old therapist ID
    const oldTherapistResult = await pool.query(
      'SELECT therapist_id FROM therapists WHERE name = $1',
      [fromTherapistName]
    );

    const fromTherapistId = oldTherapistResult.rows[0]?.therapist_id || null;

    // Update all bookings to new therapist
    const updateResult = await pool.query(
      `UPDATE bookings 
       SET booking_host_name = $1, therapist_id = $2
       WHERE ((invitee_email IS NOT NULL AND invitee_email = $3) 
              OR (invitee_phone IS NOT NULL AND invitee_phone = $4))
       AND booking_host_name = $5`,
      [newTherapist.name, toTherapistId, clientEmail || '', clientPhone || '', fromTherapistName]
    );
    
    console.log(`Updated ${updateResult.rowCount} bookings for client transfer`);

    // Insert transfer record
    await pool.query(
      `INSERT INTO client_transfer_history 
       (client_name, client_email, client_phone, from_therapist_id, from_therapist_name, 
        to_therapist_id, to_therapist_name, transferred_by_admin_id, transferred_by_admin_name, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        clientName,
        clientEmail,
        clientPhone,
        fromTherapistId,
        fromTherapistName,
        toTherapistId,
        newTherapist.name,
        transferredByAdminId,
        transferredByAdminName,
        reason
      ]
    );

    // Log client transfer
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [transferredByAdminId, transferredByAdminName, 'client_transfer', 
       `Transferred ${clientName} from ${fromTherapistName} to ${newTherapist.name}`, clientName, getCurrentISTTimestamp()]
    );

    console.log('Database insert successful');

    // Trigger n8n webhook
    const webhookData = {
      clientName,
      clientEmail,
      clientPhone,
      fromTherapist: fromTherapistName,
      fromTherapistId: fromTherapistId || 'N/A',
      toTherapist: newTherapist.name,
      toTherapistId: toTherapistId,
      transferredBy: transferredByAdminName,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    };
    const webhookUrl = `https://n8n.srv1169280.hstgr.cloud/webhook/efc4396f-401b-4d46-bfdb-e990a3ac3846?${new URLSearchParams(webhookData as any).toString()}`;
    console.log('Calling webhook:', webhookUrl);
    
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'GET'
      });
      console.log('Webhook status:', webhookResponse.status);
      const webhookResponseData = await webhookResponse.text();
      console.log('Webhook response:', webhookResponseData);
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
    }

    // Notify new therapist
    const newTherapistUser = await pool.query(
      "SELECT id FROM users WHERE therapist_id = $1 AND role = 'therapist'",
      [toTherapistId]
    );
    if (newTherapistUser.rows.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [newTherapistUser.rows[0].id, 'therapist', 'client_transfer', 'New Client Assigned',
         `Client ${clientName} has been transferred to you from ${fromTherapistName}`]
      );
    }

    // Notify old therapist
    if (fromTherapistId) {
      const oldTherapistUser = await pool.query(
        "SELECT id FROM users WHERE therapist_id = $1 AND role = 'therapist'",
        [fromTherapistId]
      );
      if (oldTherapistUser.rows.length > 0) {
        await pool.query(
          `INSERT INTO notifications (user_id, user_role, notification_type, title, message)
           VALUES ($1, $2, $3, $4, $5)`,
          [oldTherapistUser.rows[0].id, 'therapist', 'client_transfer', 'Client Transferred',
           `Client ${clientName} has been transferred to ${newTherapist.name}`]
        );
      }
    }



    console.log('Sending success response');
    res.json({ success: true, message: 'Client transferred successfully' });
  } catch (error) {
    console.error('Error transferring client:', error);
    res.status(500).json({ success: false, error: 'Failed to transfer client' });
  }
});

// Get audit logs (last 30 days only for frontend)
app.get('/api/audit-logs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE is_visible = true 
       ORDER BY log_id DESC 
       LIMIT 500`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Clear audit logs (soft delete)
app.post('/api/audit-logs/clear', async (req, res) => {
  try {
    await pool.query('UPDATE audit_logs SET is_visible = false WHERE is_visible = true');
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing audit logs:', error);
    res.status(500).json({ error: 'Failed to clear audit logs' });
  }
});

// Create audit log
app.post('/api/audit-logs', async (req, res) => {
  try {
    const { therapist_id, therapist_name, action_type, action_description, client_name, ip_address } = req.body;
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, ip_address, timestamp, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [therapist_id, therapist_name, action_type, action_description, client_name, ip_address, getCurrentISTTimestamp()]
    );
    console.log('✅ Manual audit log created:', action_type, therapist_name);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Logout endpoint
app.post('/api/logout', async (req, res) => {
  try {
    const { user } = req.body;
    
    if (user?.role === 'therapist') {
      try {
        await pool.query(
          `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, timestamp, is_visible)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [user.therapist_id, user.username, 'logout', `${user.username} logged out`, getCurrentISTTimestamp()]
        );
        console.log('✅ Audit log created for logout:', user.username, user.therapist_id);
      } catch (auditError) {
        console.error('❌ Failed to create audit log for logout:', auditError);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// Get additional notes for a booking
app.get('/api/additional-notes', async (req, res) => {
  try {
    const { booking_id } = req.query;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const result = await pool.query(
      'SELECT * FROM client_additional_notes WHERE booking_id = $1 ORDER BY created_at DESC',
      [booking_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching additional notes:', error);
    res.status(500).json({ error: 'Failed to fetch additional notes' });
  }
});

// Save/Update additional note
app.post('/api/additional-notes', async (req, res) => {
  try {
    const { note_id, booking_id, therapist_id, therapist_name, note_text } = req.body;
    
    if (!booking_id || !therapist_id || !note_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (note_id) {
      // Update existing note
      await pool.query(
        'UPDATE client_additional_notes SET note_text = $1, updated_at = CURRENT_TIMESTAMP WHERE note_id = $2',
        [note_text, note_id]
      );
    } else {
      // Insert new note
      await pool.query(
        'INSERT INTO client_additional_notes (booking_id, therapist_id, therapist_name, note_text) VALUES ($1, $2, $3, $4)',
        [booking_id, therapist_id, therapist_name, note_text]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving additional note:', error);
    res.status(500).json({ error: 'Failed to save additional note' });
  }
});

// Get session notes
app.get('/api/session-notes', async (req, res) => {
  try {
    const { booking_id } = req.query;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const result = await pool.query(
      `SELECT csn.*, b.booking_invitee_time as session_timing
       FROM client_session_notes csn
       LEFT JOIN bookings b ON csn.booking_id = b.booking_id
       WHERE csn.booking_id = $1`,
      [booking_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session notes not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session notes:', error);
    res.status(500).json({ error: 'Failed to fetch session notes' });
  }
});

// Get paperform link
app.get('/api/paperform-link', async (req, res) => {
  try {
    const { booking_id } = req.query;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const result = await pool.query(
      'SELECT paperform_link FROM client_doc_form WHERE booking_id = $1',
      [booking_id]
    );

    if (result.rows.length > 0) {
      res.json({ paperform_link: result.rows[0].paperform_link });
    } else {
      res.json({ paperform_link: null });
    }
  } catch (error) {
    console.error('Error fetching paperform link:', error);
    res.status(500).json({ error: 'Failed to fetch paperform link' });
  }
});

// Save/Update session notes
app.post('/api/session-notes', async (req, res) => {
  try {
    const { booking_id, therapist_id, therapist_name, client_name, notes } = req.body;
    
    if (!booking_id || !therapist_id || !notes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if notes exist
    const existing = await pool.query(
      'SELECT note_id FROM client_session_notes WHERE booking_id = $1',
      [booking_id]
    );

    if (existing.rows.length > 0) {
      // Update existing notes
      await pool.query(
        'UPDATE client_session_notes SET notes = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2',
        [notes, booking_id]
      );
    } else {
      // Insert new notes
      await pool.query(
        'INSERT INTO client_session_notes (booking_id, therapist_id, notes) VALUES ($1, $2, $3)',
        [booking_id, therapist_id, notes]
      );
    }

    // Log session note update
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [therapist_id, therapist_name, 'session_notes', 
       `${existing.rows.length > 0 ? 'Updated' : 'Added'} session notes for ${client_name}`, client_name, getCurrentISTTimestamp()]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving session notes:', error);
    res.status(500).json({ error: 'Failed to save session notes' });
  }
});

// Cancel booking
app.post('/api/bookings/cancel', async (req, res) => {
  try {
    const { booking_id, therapist_id, therapist_name, client_name, reason } = req.body;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Update booking status
    await pool.query(
      'UPDATE bookings SET booking_status = $1 WHERE booking_id = $2',
      ['cancelled', booking_id]
    );

    // Log cancellation
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [therapist_id, therapist_name, 'booking_cancel', 
       `Cancelled booking for ${client_name}${reason ? ': ' + reason : ''}`, client_name, getCurrentISTTimestamp()]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get refunds and cancellations
app.get('/api/refunds', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        r.client_name,
        r.session_name,
        r.session_timings,
        r.refund_status,
        COALESCE(b.invitee_phone, '') as invitee_phone,
        COALESCE(b.invitee_email, '') as invitee_email,
        COALESCE(b.refund_amount, 0) as refund_amount
      FROM refund_cancellation_table r
      LEFT JOIN bookings b ON r.session_id = b.booking_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status && status !== 'all') {
      if (status.toLowerCase() === 'pending') {
        query += " AND (LOWER(r.refund_status) = 'pending' OR LOWER(r.refund_status) = 'initiated' OR r.refund_status IS NULL)";
      } else {
        query += ' AND LOWER(r.refund_status) = LOWER($1)';
        params.push(status);
      }
    }
    
    query += ' ORDER BY r.session_timings DESC';
    
    const result = await pool.query(query, params);
    
    const refunds = result.rows.map(row => {
      let formattedTimings = 'N/A';
      if (row.session_timings) {
        const date = new Date(row.session_timings);
        const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
        const endDate = new Date(istDate.getTime() + (50 * 60 * 1000));
        
        const formatTime = (d: Date) => {
          const hours = d.getHours();
          const minutes = d.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const hour12 = hours % 12 || 12;
          return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        };
        
        const weekday = istDate.toLocaleDateString('en-US', { weekday: 'long' });
        const month = istDate.toLocaleDateString('en-US', { month: 'short' });
        const day = istDate.getDate();
        const year = istDate.getFullYear();
        
        formattedTimings = `${weekday}, ${month} ${day}, ${year} at ${formatTime(istDate)} - ${formatTime(endDate)} IST`;
      }
      
      return {
        ...row,
        session_timings: formattedTimings,
        refund_status: row.refund_status || 'Pending'
      };
    });
    
    res.json(refunds);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

// Get notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_id, user_role } = req.query;
    
    if (!user_id || !user_role) {
      return res.status(400).json({ error: 'User ID and role required' });
    }

    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND user_role = $2 ORDER BY created_at DESC LIMIT 50',
      [user_id, user_role]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get client profile
app.get('/api/client-profile', async (req, res) => {
  try {
    const { userId } = req.query;

    const userResult = await pool.query(
      'SELECT id, username, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const bookingResult = await pool.query(
      `SELECT invitee_phone, invitee_email, emergency_contact_name, emergency_contact_number 
       FROM bookings 
       WHERE invitee_name ILIKE $1 
       ORDER BY invitee_created_at DESC 
       LIMIT 1`,
      [`%${user.full_name}%`]
    );

    const booking = bookingResult.rows[0] || {};

    res.json({
      full_name: user.full_name,
      whatsapp_no: booking.invitee_phone?.replace('+91 ', '') || '',
      email: booking.invitee_email || '',
      emergency_contact_name: booking.emergency_contact_name || '',
      emergency_contact_number: booking.emergency_contact_number || ''
    });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update client profile
app.post('/api/client-profile', async (req, res) => {
  try {
    const { userId, fullName } = req.body;

    await pool.query(
      'UPDATE users SET full_name = $1 WHERE id = $2',
      [fullName, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating client profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = true WHERE notification_id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/mark-all-read', async (req, res) => {
  try {
    const { user_id, user_role } = req.body;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND user_role = $2',
      [user_id, user_role]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notifications WHERE notification_id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification for all admins
app.post('/api/notifications/create-admin', async (req, res) => {
  try {
    const { notification_type, title, message, related_id } = req.body;
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    
    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [admin.id, 'admin', notification_type, title, message, related_id]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating admin notifications:', error);
    res.status(500).json({ error: 'Failed to create notifications' });
  }
});

// Webhook to notify new bookings
app.post('/api/webhooks/new-booking', async (req, res) => {
  try {
    const { booking_id } = req.body;
    
    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID required' });
    }

    const bookingResult = await pool.query(
      `SELECT b.booking_id, b.invitee_name, b.booking_resource_name, 
              b.booking_host_name, t.therapist_id, u.id as user_id
       FROM bookings b
       LEFT JOIN therapists t ON b.booking_host_name ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
       LEFT JOIN users u ON u.therapist_id = t.therapist_id AND u.role = 'therapist'
       WHERE b.booking_id = $1`,
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Notify therapist
    if (booking.user_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [booking.user_id, 'therapist', 'new_booking', 'New Booking Assigned',
         `New session "${booking.booking_resource_name}" booked with ${booking.invitee_name}`, booking.booking_id]
      );
    }

    // Notify all admins
    const admins = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, user_role, notification_type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [admin.id, 'admin', 'new_booking', 'New Booking Created',
         `${booking.invitee_name} booked "${booking.booking_resource_name}" with ${booking.booking_host_name}`, booking.booking_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error notifying new booking:', error);
    res.status(500).json({ error: 'Failed to notify new booking' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`\n✓ API server running on http://localhost:${PORT}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n✗ Port ${PORT} is already in use. Please stop other processes or change the port.`);
  } else {
    console.error('\n✗ Server error:', err);
  }
  process.exit(1);
});
