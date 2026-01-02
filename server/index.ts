import express from 'express';
import cors from 'cors';
import pool from '../lib/db';
import { convertToIST } from '../lib/timezone';

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
        await pool.query(
          `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, timestamp)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')`,
          [user.therapist_id, username, 'login', `${username} logged into dashboard`]
        );
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
          'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status != $1 AND booking_start_at BETWEEN $2 AND $3',
          ['cancelled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status != $1',
          ['cancelled']
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
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status = $1 AND booking_start_at BETWEEN $2 AND $3',
          ['cancelled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_status = $1',
          ['cancelled']
        );

    const refunds = hasDateFilter
      ? await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE refund_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['completed', 'processed', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE refund_status IN ($1, $2)',
          ['completed', 'processed']
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
      'SELECT COUNT(*) as total FROM bookings WHERE booking_status = $1 AND booking_start_at BETWEEN $2 AND $3',
      ['cancelled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
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
          WHERE booking_status != $1
            AND booking_start_at BETWEEN $2 AND $3
          ORDER BY booking_start_at ASC
          LIMIT 10`,
          ['cancelled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          `SELECT 
            invitee_name as client_name,
            booking_resource_name as therapy_type,
            booking_mode as mode,
            booking_host_name as therapist_name,
            booking_invitee_time
          FROM bookings
          WHERE booking_status != $1
            AND booking_start_at >= NOW()
          ORDER BY booking_start_at ASC
          LIMIT 10`,
          ['cancelled']
        );

    const convertToIST = (timeStr: string) => {
      const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
      if (!match) return timeStr;
      
      const [, date, startTime, endTime, offset] = match;
      const parseTime = (time: string, dateStr: string, tz: string) => {
        const [h, rest] = time.split(':');
        const [m, period] = rest.split(' ');
        let hour = parseInt(h);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const [offsetHours, offsetMins] = tz.replace('GMT', '').split(':').map(n => parseInt(n));
        const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
        const istOffset = 330;
        const diff = istOffset - offsetTotal;
        
        let totalMins = hour * 60 + parseInt(m) + diff;
        const newHour = Math.floor(totalMins / 60) % 24;
        const newMin = totalMins % 60;
        
        const period12 = newHour >= 12 ? 'PM' : 'AM';
        const hour12 = newHour % 12 || 12;
        return `${hour12}:${newMin.toString().padStart(2, '0')} ${period12}`;
      };
      
      const istStart = parseTime(startTime, date, `GMT${offset}`);
      const istEnd = parseTime(endTime, date, `GMT${offset}`);
      
      return `${date} at ${istStart} - ${istEnd} IST`;
    };

    const bookings = result.rows.map(row => ({
      ...row,
      booking_start_at: convertToIST(row.booking_invitee_time),
      mode: row.mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
        COUNT(*) as session_count,
        MAX(invitee_created_at) as created_at,
        MAX(booking_start_at) as latest_booking_date
      FROM bookings
      GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name
      
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

    // Group by unique client (email OR phone)
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
          latest_booking_date: row.latest_booking_date,
          therapists: []
        });
      }
      
      const client = clientMap.get(key);
      client.session_count += parseInt(row.session_count) || 0;
      
      // Only add to therapists array if session_count > 0
      if (parseInt(row.session_count) > 0) {
        client.therapists.push({
          invitee_name: row.invitee_name,
          invitee_phone: row.invitee_phone,
          booking_host_name: row.booking_host_name,
          session_count: parseInt(row.session_count) || 0,
          latest_booking_date: row.latest_booking_date
        });
      }
      
      // Update to show therapist with most recent booking (only if has sessions)
      if (parseInt(row.session_count) > 0 && new Date(row.latest_booking_date) > new Date(client.latest_booking_date)) {
        client.latest_booking_date = row.latest_booking_date;
        client.booking_host_name = row.booking_host_name;
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
        booking_invitee_time,
        booking_resource_name,
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_mode,
        booking_start_at,
        booking_joining_link,
        booking_checkin_url
      FROM bookings
      ORDER BY booking_start_at DESC
    `);

    const convertToIST = (timeStr: string) => {
      const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
      if (!match) return timeStr;
      
      const [, date, startTime, endTime, offset] = match;
      const parseTime = (time: string, dateStr: string, tz: string) => {
        const [h, rest] = time.split(':');
        const [m, period] = rest.split(' ');
        let hour = parseInt(h);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const [offsetHours, offsetMins] = tz.replace('GMT', '').split(':').map(n => parseInt(n));
        const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
        const istOffset = 330;
        const diff = istOffset - offsetTotal;
        
        let totalMins = hour * 60 + parseInt(m) + diff;
        const newHour = Math.floor(totalMins / 60) % 24;
        const newMin = totalMins % 60;
        
        const period12 = newHour >= 12 ? 'PM' : 'AM';
        const hour12 = newHour % 12 || 12;
        return `${hour12}:${newMin.toString().padStart(2, '0')} ${period12}`;
      };
      
      const istStart = parseTime(startTime, date, `GMT${offset}`);
      const istEnd = parseTime(endTime, date, `GMT${offset}`);
      
      return `${date} at ${istStart} - ${istEnd} IST`;
    };

    const appointments = result.rows.map(row => ({
      ...row,
      booking_start_at: convertToIST(row.booking_invitee_time),
      booking_mode: row.booking_mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      booking_joining_link: row.booking_joining_link,
      booking_checkin_url: row.booking_checkin_url
    }));

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
    const { clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation } = req.body;

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
        END) as sessions_this_month
      FROM therapists t
      LEFT JOIN bookings b ON TRIM(b.booking_host_name) ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
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
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
          [`%${therapistFirstName}%`, 'cancelled', start, `${end} 23:59:59`]
        )
      : await pool.query(
          'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2',
          [`%${therapistFirstName}%`, 'cancelled']
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
      'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
      [`%${therapistFirstName}%`, 'cancelled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );

    // Get upcoming bookings directly from bookings table
    const upcomingResult = await pool.query(`
      SELECT 
        invitee_name as client_name,
        booking_resource_name as session_name,
        booking_mode as mode,
        booking_invitee_time as session_timings,
        booking_start_at as booking_date
      FROM bookings
      WHERE booking_host_name ILIKE $1
        AND booking_start_at > NOW()
        AND booking_status != 'cancelled'
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
        client_name: booking.client_name,
        therapy_type: booking.session_name,
        mode: booking.mode?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Google Meet',
        session_timings: convertToIST(booking.session_timings)
      }))
    });

  } catch (error) {
    console.error('Therapist stats error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist stats' });
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
        COUNT(*) as total_sessions
      FROM bookings
      WHERE booking_host_name ILIKE $1
      GROUP BY invitee_name, invitee_email, invitee_phone
      ORDER BY MAX(booking_start_at) DESC
    `, [`%${therapistFirstName}%`]);

    // Group by unique client (email OR phone)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    clientsResult.rows.forEach(row => {
      let key = null;
      
      if (row.client_email && emailToKey.has(row.client_email)) {
        key = emailToKey.get(row.client_email);
      } else if (row.client_phone && phoneToKey.has(row.client_phone)) {
        key = phoneToKey.get(row.client_phone);
      } else {
        key = `client-${clientMap.size}`;
      }
      
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
});

// Get therapist appointments
app.get('/api/therapist-appointments', async (req, res) => {
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

    // Get appointments for this therapist directly from bookings table
    const appointmentsResult = await pool.query(`
      SELECT 
        invitee_name as client_name,
        invitee_phone as contact_info,
        booking_resource_name as session_name,
        booking_invitee_time as session_timings,
        booking_mode as mode,
        booking_start_at as booking_date,
        booking_status
      FROM bookings
      WHERE booking_host_name ILIKE $1
      ORDER BY booking_start_at DESC
    `, [`%${therapistFirstName}%`]);

    const convertToIST = (timeStr: string) => {
      const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
      if (!match) return timeStr;
      
      const [, date, startTime, endTime, offset] = match;
      const parseTime = (time: string, dateStr: string, tz: string) => {
        const [h, rest] = time.split(':');
        const [m, period] = rest.split(' ');
        let hour = parseInt(h);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        const [offsetHours, offsetMins] = tz.replace('GMT', '').split(':').map(n => parseInt(n));
        const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
        const istOffset = 330;
        const diff = istOffset - offsetTotal;
        
        let totalMins = hour * 60 + parseInt(m) + diff;
        const newHour = Math.floor(totalMins / 60) % 24;
        const newMin = totalMins % 60;
        
        const period12 = newHour >= 12 ? 'PM' : 'AM';
        const hour12 = newHour % 12 || 12;
        return `${hour12}:${newMin.toString().padStart(2, '0')} ${period12}`;
      };
      
      const istStart = parseTime(startTime, date, `GMT${offset}`);
      const istEnd = parseTime(endTime, date, `GMT${offset}`);
      
      return `${date} at ${istStart} - ${istEnd} IST`;
    };

    const appointments = appointmentsResult.rows.map(row => ({
      ...row,
      session_timings: convertToIST(row.session_timings),
      mode: row.mode?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Google Meet',
      booking_status: row.booking_status || 'confirmed'
    }));

    res.json({
      appointments: appointments
    });

  } catch (error) {
    console.error('Therapist appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch therapist appointments' });
  }
});

// Transfer client endpoint
app.post('/api/transfer-client', async (req, res) => {
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

    res.json({ success: true, message: 'Client transferred successfully' });
  } catch (error) {
    console.error('Error transferring client:', error);
    res.status(500).json({ success: false, error: 'Failed to transfer client' });
  }
});

// Get audit logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE is_visible = true ORDER BY timestamp DESC LIMIT 500'
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
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, ip_address, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')`,
      [therapist_id, therapist_name, action_type, action_description, client_name, ip_address]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Logout endpoint
app.post('/api/logout', async (req, res) => {
  try {
    const { user } = req.body;
    
    if (user?.role === 'therapist') {
      await pool.query(
        `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, timestamp)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')`,
        [user.therapist_id, user.username, 'logout', `${user.username} logged out`]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
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
