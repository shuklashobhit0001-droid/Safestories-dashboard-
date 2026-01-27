import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './lib/db.js';
import { notifyAllAdmins, notifyTherapist } from './lib/notifications.js';
import { convertToIST } from './lib/timezone.js';

// Helper function to get current IST timestamp as formatted string
const getCurrentISTTimestamp = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' IST';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract route from URL path
  const urlPath = req.url?.split('?')[0] || '';
  
  // Handle notifications/:id/read pattern
  const notificationReadMatch = urlPath.match(/\/api\/notifications\/(\d+)\/read/);
  if (notificationReadMatch) {
    const notificationId = notificationReadMatch[1];
    return await handleNotificationReadById(req, res, notificationId);
  }
  
  const route = urlPath.replace('/api/', '').replace('/api/index', '') || req.query.route as string;
  
  if (!route || route === 'index') {
    return res.status(400).json({ error: 'Route parameter required' });
  }

  try {
    switch (route) {
      case 'login':
        return await handleLogin(req, res);
      case 'live-sessions-count':
        return await handleLiveSessionsCount(req, res);
      case 'therapists':
        return await handleTherapists(req, res);
      case 'therapists-live-status':
        return await handleTherapistsLiveStatus(req, res);
      case 'therapists-by-therapy':
        return await handleTherapistsByTherapy(req, res);
      case 'clients':
        return await handleClients(req, res);
      case 'appointments':
        return await handleAppointments(req, res);
      case 'therapies':
        return await handleTherapies(req, res);
      case 'refunds':
        return await handleRefunds(req, res);
      case 'booking-requests':
        return await handleBookingRequests(req, res);
      case 'therapist-appointments':
        return await handleTherapistAppointments(req, res);
      case 'therapist-clients':
        return await handleTherapistClients(req, res);
      case 'client-details':
        return await handleClientDetails(req, res);
      case 'client-appointments':
        return await handleClientAppointments(req, res);
      case 'therapist-details':
        return await handleTherapistDetails(req, res);
      case 'therapist-stats':
        return await handleTherapistStats(req, res);
      case 'dashboard/bookings':
        return await handleDashboardBookings(req, res);
      case 'dashboard/stats':
        return await handleDashboardStats(req, res);
      case 'transfer-client':
        return await handleTransferClient(req, res);
      case 'audit-logs':
        return await handleAuditLogs(req, res);
      case 'audit-logs/clear':
        return await handleClearAuditLogs(req, res);
      case 'logout':
        return await handleLogout(req, res);
      case 'session-notes':
        return await handleSessionNotes(req, res);
      case 'additional-notes':
        return await handleAdditionalNotes(req, res);
      case 'paperform-link':
        return await handlePaperformLink(req, res);
      case 'notifications':
        return await handleNotifications(req, res);
      case 'notifications/mark-all-read':
        return await handleNotificationsMarkAllRead(req, res);
      case 'notifications/read':
        return await handleNotificationRead(req, res);
      case 'notifications/delete':
        return await handleNotificationDelete(req, res);
      case 'booking-status':
        return await handleBookingStatus(req, res);
      case 'session-notes-submit':
        return await handleSessionNotesSubmit(req, res);
      case 'webhook/booking-created':
        return await handleBookingWebhook(req, res);
      case 'refund-status':
        return await handleRefundStatus(req, res);
      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2', [username, password]);
  if (result.rows.length > 0) {
    const user = result.rows[0];
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
}

async function handleLiveSessionsCount(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as live_count
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND booking_start_at <= NOW()
        AND booking_start_at + INTERVAL '50 minutes' >= NOW()
    `);

    return res.status(200).json({ liveCount: parseInt(result.rows[0].live_count) || 0 });
  } catch (error: any) {
    console.error('[live-sessions-count] ERROR:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch live sessions count',
      message: error.message
    });
  }
}

async function handleTherapists(req: VercelRequest, res: VercelResponse) {
  const result = await pool.query(`
    SELECT t.therapist_id, t.name, t.specialization, t.contact_info,
      COUNT(DISTINCT b.booking_id) as total_sessions_lifetime,
      COUNT(DISTINCT CASE WHEN EXTRACT(MONTH FROM b.booking_start_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM b.booking_start_at) = EXTRACT(YEAR FROM CURRENT_DATE) THEN b.booking_id END) as sessions_this_month,
      COALESCE(SUM(b.invitee_payment_amount), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM b.booking_start_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM b.booking_start_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        THEN b.invitee_payment_amount ELSE 0 END), 0) as revenue_this_month
    FROM therapists t
    LEFT JOIN bookings b ON (TRIM(b.booking_host_name) ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%' OR TRIM(b.booking_host_name) ILIKE t.name)
    GROUP BY t.therapist_id, t.name, t.specialization, t.contact_info
    ORDER BY t.name ASC
  `);
  res.json(result.rows);
}

async function handleTherapistsLiveStatus(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT booking_host_name, booking_invitee_time, booking_start_at
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND booking_start_at <= NOW()
        AND booking_start_at >= NOW() - INTERVAL '2 hours'
    `);

    const liveStatus: { [key: string]: boolean } = {};
    const now = new Date();

    result.rows.forEach(row => {
      const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const startTime = new Date(row.booking_start_at);
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        const endTimeStr = timeMatch[2];
        
        if (dateStr) {
          const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
          if (now >= startTime && now <= endDateTime) {
            const firstName = row.booking_host_name.split(' ')[0];
            liveStatus[firstName] = true;
          }
        }
      }
    });

    res.json(liveStatus);
  } catch (error) {
    console.error('Error fetching therapists live status:', error);
    res.status(500).json({ error: 'Failed to fetch therapists live status' });
  }
}

async function handleTherapistsByTherapy(req: VercelRequest, res: VercelResponse) {
  try {
    const { therapy_name } = req.query;
    
    if (!therapy_name) {
      return res.status(400).json({ error: 'Therapy name is required' });
    }

    const result = await pool.query(`
      SELECT therapist_id, name as therapist_name
      FROM therapists
      WHERE specialization ILIKE $1
      ORDER BY name ASC
    `, [`%${therapy_name}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching therapists by therapy:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
}

async function handleClients(req: VercelRequest, res: VercelResponse) {
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
  
  const clients = Array.from(clientMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(clients);
}

async function handleAppointments(req: VercelRequest, res: VercelResponse) {
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
      return {
        booking_id: row.booking_id,
        booking_start_at: convertToIST(row.booking_invitee_time),
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
        booking_status: row.booking_status,
        booking_start_at_raw: row.booking_start_at
      };
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

async function handleTherapies(req: VercelRequest, res: VercelResponse) {
  const result = await pool.query('SELECT DISTINCT specialization FROM therapists WHERE specialization IS NOT NULL');
  const therapySet = new Set<string>();
  result.rows.forEach(row => {
    const specializations = row.specialization.split(',').map((s: string) => s.trim());
    specializations.forEach((spec: string) => therapySet.add(spec));
  });
  const therapies = Array.from(therapySet).sort().map(therapy => ({ therapy_name: therapy }));
  res.json(therapies);
}

async function handleRefunds(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  
  const { status } = req.query;
  
  let query = `
    SELECT 
      r.client_name,
      r.session_name,
      r.session_timings,
      b.refund_status,
      COALESCE(b.invitee_phone, '') as invitee_phone,
      COALESCE(b.invitee_email, '') as invitee_email,
      COALESCE(b.refund_amount, 0) as refund_amount
    FROM refund_cancellation_table r
    LEFT JOIN bookings b ON r.session_id = b.booking_id
    WHERE b.booking_status IN ('cancelled', 'canceled')
      AND b.refund_status IS NOT NULL
      AND LOWER(b.refund_status) IN ('initiated', 'failed')
  `;
  
  const params: any[] = [];
  
  if (status && status !== 'all') {
    if (String(status).toLowerCase() === 'pending') {
      query += " AND LOWER(b.refund_status) = 'initiated'";
    } else if (String(status).toLowerCase() === 'initiated') {
      query += " AND LOWER(b.refund_status) = 'initiated'";
    } else if (String(status).toLowerCase() === 'failed') {
      query += " AND LOWER(b.refund_status) = 'failed'";
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
  
  res.status(200).json(refunds);
}

async function handleBookingRequests(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation } = req.body;
  const result = await pool.query(
    `INSERT INTO booking_requests (client_name, client_whatsapp, client_email, therapy_type, therapist_name, booking_link, status, is_free_consultation)
     VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7) RETURNING *`,
    [clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation || false]
  );
  
  // Notify admins about new booking request
  await notifyAllAdmins(
    'new_booking_request',
    'New Booking Request',
    `Booking request to ${clientName} for ${therapyType}`,
    result.rows[0].request_id
  );
  
  res.json({ success: true, data: result.rows[0] });
}

async function handleTherapistAppointments(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { therapist_id } = req.query;
  if (!therapist_id) return res.status(400).json({ error: 'Therapist ID is required' });
  const userResult = await pool.query('SELECT therapist_id FROM users WHERE id = $1 AND role = $2', [therapist_id, 'therapist']);
  if (userResult.rows.length === 0) return res.status(404).json({ error: 'Therapist user not found' });
  const therapistUserId = userResult.rows[0].therapist_id;
  const therapistResult = await pool.query('SELECT * FROM therapists WHERE therapist_id = $1', [therapistUserId]);
  const therapist = therapistResult.rows[0];
  const therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';
  const appointmentsResult = await pool.query(`
    SELECT b.invitee_name as client_name, b.invitee_phone as contact_info, b.booking_resource_name as session_name,
      b.booking_invitee_time as session_timings, b.booking_mode as mode, b.booking_start_at as booking_date, 
      b.booking_status, b.booking_id,
      CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
    FROM bookings b
    LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
    WHERE b.booking_host_name ILIKE $1 ORDER BY b.booking_start_at DESC
  `, [`%${therapistFirstName}%`]);
  
  const appointments = appointmentsResult.rows.map(apt => ({
    ...apt,
    session_timings: convertToIST(apt.session_timings),
    mode: apt.mode ? apt.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet'
  }));
  
  res.json({ appointments });
}

async function handleTherapistClients(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { therapist_id } = req.query;
  if (!therapist_id) return res.status(400).json({ error: 'Therapist ID is required' });
  const userResult = await pool.query('SELECT therapist_id FROM users WHERE id = $1 AND role = $2', [therapist_id, 'therapist']);
  if (userResult.rows.length === 0) return res.status(404).json({ error: 'Therapist user not found' });
  const therapistUserId = userResult.rows[0].therapist_id;
  const therapistResult = await pool.query('SELECT * FROM therapists WHERE therapist_id = $1', [therapistUserId]);
  const therapist = therapistResult.rows[0];
  const therapistFirstName = therapist ? therapist.name.split(' ')[0] : '';
  const clientsResult = await pool.query(`
    SELECT invitee_name as client_name, invitee_email as client_email, invitee_phone as client_phone,
      booking_start_at, COUNT(*) as total_sessions
    FROM bookings WHERE booking_host_name ILIKE $1
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
}

async function handleTherapistDetails(req: VercelRequest, res: VercelResponse) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Therapist name is required' });
  
  const clientsResult = await pool.query(`
    SELECT DISTINCT invitee_name, invitee_email, invitee_phone, booking_start_at
    FROM bookings WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
    ORDER BY booking_start_at DESC
  `, [name]);
  
  // Group by email (primary) or phone (fallback)
  const clientMap = new Map();
  const emailToKey = new Map();
  const phoneToKey = new Map();
  
  clientsResult.rows.forEach(row => {
    const email = row.invitee_email ? row.invitee_email.toLowerCase().trim() : null;
    const phone = row.invitee_phone ? row.invitee_phone.replace(/[\s\-\(\)\+]/g, '') : null;
    
    let key = null;
    
    if (email && emailToKey.has(email)) {
      key = emailToKey.get(email);
    } else if (phone && phoneToKey.has(phone)) {
      key = phoneToKey.get(phone);
      if (email) {
        const oldData = clientMap.get(key);
        clientMap.delete(key);
        key = email;
        clientMap.set(key, oldData);
        emailToKey.set(email, key);
      }
    } else {
      key = email || phone;
    }
    
    if (!key) return;
    
    if (email) emailToKey.set(email, key);
    if (phone) phoneToKey.set(phone, key);
    
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        invitee_name: row.invitee_name,
        invitee_email: row.invitee_email,
        invitee_phone: row.invitee_phone,
        latest_booking_date: row.booking_start_at
      });
    } else {
      const client = clientMap.get(key);
      if (new Date(row.booking_start_at) > new Date(client.latest_booking_date)) {
        client.latest_booking_date = row.booking_start_at;
        client.invitee_phone = row.invitee_phone;
      }
      if (row.invitee_email && !client.invitee_email) {
        client.invitee_email = row.invitee_email;
      }
    }
  });
  
  const clients = Array.from(clientMap.values()).map(({ latest_booking_date, ...client }) => client);
  
  const appointmentsResult = await pool.query(`
    SELECT invitee_name, booking_resource_name, booking_start_at, booking_invitee_time
    FROM bookings WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
    ORDER BY booking_start_at DESC
  `, [name]);
  
  const appointments = appointmentsResult.rows.map(apt => ({
    ...apt,
    booking_invitee_time: convertToIST(apt.booking_invitee_time)
  }));
  
  res.json({ clients, appointments });
}

async function handleTherapistStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { therapist_id, start, end } = req.query;
  if (!therapist_id) return res.status(400).json({ error: 'Therapist ID is required' });
  const userResult = await pool.query('SELECT therapist_id FROM users WHERE id = $1 AND role = $2', [therapist_id, 'therapist']);
  if (userResult.rows.length === 0) return res.status(404).json({ error: 'Therapist user not found' });
  const therapistUserId = userResult.rows[0].therapist_id;
  const therapistResult = await pool.query('SELECT * FROM therapists WHERE therapist_id = $1', [therapistUserId]);
  const therapist = therapistResult.rows[0] || { name: 'Ishika Mahajan', specialization: 'Individual Therapy' };
  const therapistFirstName = therapist.name.split(' ')[0];
  const hasDateFilter = start && end;
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const sessions = hasDateFilter
    ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
        [`%${therapistFirstName}%`, 'confirmed', 'rescheduled', start, `${end} 23:59:59`])
    : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3)',
        [`%${therapistFirstName}%`, 'confirmed', 'rescheduled']);
  const noShows = hasDateFilter
    ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
        [`%${therapistFirstName}%`, 'no_show', start, `${end} 23:59:59`])
    : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2',
        [`%${therapistFirstName}%`, 'no_show']);
  const cancelled = hasDateFilter
    ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
        [`%${therapistFirstName}%`, 'cancelled', start, `${end} 23:59:59`])
    : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2',
        [`%${therapistFirstName}%`, 'cancelled']);
  const lastMonthSessions = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
    [`%${therapistFirstName}%`, 'confirmed', 'rescheduled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);
  const lastMonthNoShows = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
    [`%${therapistFirstName}%`, 'no_show', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);
  const lastMonthCancelled = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
    [`%${therapistFirstName}%`, 'cancelled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);
  const upcomingResult = await pool.query(`
    SELECT invitee_name as client_name, booking_resource_name as session_name, booking_mode as mode,
      booking_invitee_time as session_timings, booking_start_at as booking_date
    FROM bookings WHERE booking_host_name ILIKE $1 AND booking_start_at >= NOW() AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    ORDER BY booking_start_at ASC LIMIT 10
  `, [`%${therapistFirstName}%`]);
  
  res.json({
    therapist: { name: therapist.name, specialization: therapist.specialization },
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
      mode: booking.mode ? booking.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet',
      session_timings: convertToIST(booking.session_timings)
    }))
  });
}

async function handleDashboardBookings(req: VercelRequest, res: VercelResponse) {
  const { start, end } = req.query;
  const result = start && end
    ? await pool.query(`
        SELECT invitee_name as client_name, invitee_email as client_email, invitee_phone as client_phone,
          booking_resource_name as therapy_type, booking_mode as mode,
          booking_host_name as therapist_name, booking_invitee_time, booking_joining_link, booking_checkin_url
        FROM bookings WHERE booking_status != 'cancelled' AND booking_start_at BETWEEN $1 AND $2
        ORDER BY booking_start_at ASC LIMIT 10
      `, [start, `${end} 23:59:59`])
    : await pool.query(`
        SELECT invitee_name as client_name, invitee_email as client_email, invitee_phone as client_phone,
          booking_resource_name as therapy_type, booking_mode as mode,
          booking_host_name as therapist_name, booking_invitee_time, booking_joining_link, booking_checkin_url
        FROM bookings WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') 
          AND booking_start_at + INTERVAL '50 minutes' >= NOW()
        ORDER BY booking_start_at ASC LIMIT 10
      `);
  const bookings = result.rows.map(row => ({
    ...row, booking_start_at: convertToIST(row.booking_invitee_time),
    mode: row.mode ? row.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet'
  }));
  res.json(bookings);
}

async function handleDashboardStats(req: VercelRequest, res: VercelResponse) {
  const { start, end } = req.query;
  const dateFilter = start && end ? `AND invitee_created_at BETWEEN '${start}' AND '${end} 23:59:59'` : '';
  const revenue = await pool.query(`SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ('cancelled', 'canceled') ${dateFilter}`);
  const sessions = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') ${dateFilter}`);
  const freeConsultations = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) ${dateFilter}`);
  const cancelled = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ('cancelled', 'canceled') ${dateFilter}`);
  const refunds = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL ${dateFilter}`);
  const refundedAmount = await pool.query(`SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL ${dateFilter}`);
  const noShows = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ('no_show', 'no show') ${dateFilter}`);
  res.json({
    revenue: revenue.rows[0].total, 
    refundedAmount: refundedAmount.rows[0].total,
    sessions: sessions.rows[0].total, 
    freeConsultations: freeConsultations.rows[0].total,
    cancelled: cancelled.rows[0].total, 
    refunds: refunds.rows[0].total, 
    noShows: noShows.rows[0].total
  });
}

async function handleTransferClient(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const {
      clientName, clientEmail, clientPhone, fromTherapistName, toTherapistId,
      transferredByAdminId, transferredByAdminName, reason
    } = req.body;

    const therapistResult = await pool.query('SELECT * FROM therapists WHERE therapist_id = $1', [toTherapistId]);
    if (therapistResult.rows.length === 0) return res.status(404).json({ error: 'Therapist not found' });

    const newTherapist = therapistResult.rows[0];
    const oldTherapistResult = await pool.query('SELECT therapist_id FROM therapists WHERE name = $1', [fromTherapistName]);
    const fromTherapistId = oldTherapistResult.rows[0]?.therapist_id || null;

    const clientResult = await pool.query(
      'SELECT invitee_uuid FROM bookings WHERE invitee_email = $1 OR invitee_phone = $2 LIMIT 1',
      [clientEmail, clientPhone]
    );
    const clientId = clientResult.rows[0]?.invitee_uuid || null;

    await pool.query(
      `INSERT INTO client_transfer_history 
       (client_name, client_email, client_phone, from_therapist_id, from_therapist_name, 
        to_therapist_id, to_therapist_name, transferred_by_admin_id, transferred_by_admin_name, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [clientName, clientEmail, clientPhone, fromTherapistId, fromTherapistName,
       toTherapistId, newTherapist.name, transferredByAdminId, transferredByAdminName, reason]
    );

    // Notify old therapist about transfer out
    if (fromTherapistId) {
      await notifyTherapist(
        fromTherapistId,
        'client_transfer_out',
        'Client Transferred',
        `Client ${clientName} has been transferred to ${newTherapist.name}`,
        clientId
      );
    }
    
    // Notify new therapist about transfer in
    await notifyTherapist(
      toTherapistId,
      'client_transfer_in',
      'New Client Assigned',
      `Client ${clientName} has been transferred to you from ${fromTherapistName}`,
      clientId
    );
    
    // Notify admins
    await notifyAllAdmins(
      'client_transfer',
      'Client Transfer Completed',
      `${clientName} transferred from ${fromTherapistName} to ${newTherapist.name}`,
      clientId
    );

    const webhookUrl = 'https://n8n.srv1169280.hstgr.cloud/webhook/efc4396f-401b-4d46-bfdb-e990a3ac3846';
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { id: clientId, name: clientName, email: clientEmail, phone: clientPhone },
          fromTherapist: { name: fromTherapistName, id: fromTherapistId },
          toTherapist: { name: newTherapist.name, id: toTherapistId },
          admin: { id: transferredByAdminId, name: transferredByAdminName },
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString()
        })
      });
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
    }

    res.json({ success: true, message: 'Client transferred successfully' });
  } catch (error) {
    console.error('Error transferring client:', error);
    res.status(500).json({ success: false, error: 'Failed to transfer client' });
  }
}

async function handleAuditLogs(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT * FROM audit_logs 
       WHERE is_visible = true 
       ORDER BY log_id DESC 
       LIMIT 500`
    );
    return res.json(result.rows);
  }
  if (req.method === 'POST') {
    const { therapist_id, therapist_name, action_type, action_description, client_name, ip_address } = req.body;
    await pool.query(
      `INSERT INTO audit_logs (therapist_id, therapist_name, action_type, action_description, client_name, ip_address, timestamp, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [therapist_id, therapist_name, action_type, action_description, client_name, ip_address, getCurrentISTTimestamp()]
    );
    return res.json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleClearAuditLogs(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await pool.query('UPDATE audit_logs SET is_visible = false WHERE is_visible = true');
  res.json({ success: true });
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
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
}

async function handleAdditionalNotes(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { booking_id } = req.query;
    if (!booking_id) return res.status(400).json({ error: 'Booking ID is required' });
    
    const result = await pool.query(
      'SELECT * FROM client_additional_notes WHERE booking_id = $1 ORDER BY created_at DESC',
      [booking_id]
    );
    return res.json(result.rows);
  }
  
  if (req.method === 'POST') {
    const { note_id, booking_id, therapist_id, therapist_name, note_text } = req.body;
    
    if (!booking_id || !therapist_id || !note_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (note_id) {
      await pool.query(
        'UPDATE client_additional_notes SET note_text = $1, updated_at = CURRENT_TIMESTAMP WHERE note_id = $2',
        [note_text, note_id]
      );
    } else {
      await pool.query(
        'INSERT INTO client_additional_notes (booking_id, therapist_id, therapist_name, note_text) VALUES ($1, $2, $3, $4)',
        [booking_id, therapist_id, therapist_name, note_text]
      );
    }
    return res.json({ success: true });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleSessionNotes(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { booking_id } = req.query;
  if (!booking_id) return res.status(400).json({ error: 'Booking ID is required' });
  const result = await pool.query('SELECT * FROM client_session_notes WHERE booking_id = $1', [booking_id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Session notes not found' });
  res.json(result.rows[0]);
}

async function handlePaperformLink(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { booking_id } = req.query;
  if (!booking_id) return res.status(400).json({ error: 'Booking ID is required' });
  
  try {
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
}

async function handleNotifications(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { user_id, user_role } = req.query;
    if (!user_id || !user_role) return res.status(400).json({ error: 'User ID and role required' });
    
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 AND user_role = $2 ORDER BY created_at DESC LIMIT 50',
      [user_id, user_role]
    );
    return res.json(result.rows);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleNotificationsMarkAllRead(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  
  const { user_id, user_role } = req.body;
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND user_role = $2',
    [user_id, user_role]
  );
  return res.json({ success: true });
}

async function handleNotificationRead(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  
  const { notification_id } = req.body;
  if (!notification_id) return res.status(400).json({ error: 'Notification ID required' });
  
  await pool.query('UPDATE notifications SET is_read = true WHERE notification_id = $1', [notification_id]);
  return res.json({ success: true });
}

async function handleNotificationReadById(req: VercelRequest, res: VercelResponse, notificationId: string) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  
  await pool.query('UPDATE notifications SET is_read = true WHERE notification_id = $1', [notificationId]);
  return res.json({ success: true });
}

async function handleNotificationDelete(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  
  const { notification_id } = req.body;
  if (!notification_id) return res.status(400).json({ error: 'Notification ID required' });
  
  await pool.query('DELETE FROM notifications WHERE notification_id = $1', [notification_id]);
  return res.json({ success: true });
}

async function handleBookingStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { booking_id, status, therapist_id, client_name, session_name } = req.body;
  
  try {
    await pool.query('UPDATE bookings SET booking_status = $1 WHERE booking_id = $2', [status, booking_id]);
    
    // Notify based on status change
    if (status === 'cancelled') {
      await notifyAllAdmins(
        'booking_cancelled',
        'Booking Cancelled',
        `Session "${session_name}" with ${client_name} has been cancelled`,
        booking_id
      );
      
      if (therapist_id) {
        await notifyTherapist(
          therapist_id,
          'booking_cancelled',
          'Session Cancelled',
          `Your session "${session_name}" with ${client_name} has been cancelled`,
          booking_id
        );
      }
    } else if (status === 'rescheduled') {
      await notifyAllAdmins(
        'booking_rescheduled',
        'Booking Rescheduled',
        `Session "${session_name}" with ${client_name} has been rescheduled`,
        booking_id
      );
      
      if (therapist_id) {
        await notifyTherapist(
          therapist_id,
          'booking_rescheduled',
          'Session Rescheduled',
          `Your session "${session_name}" with ${client_name} has been rescheduled`,
          booking_id
        );
      }
    } else if (status === 'no_show') {
      await notifyAllAdmins(
        'no_show',
        'Client No-Show',
        `${client_name} did not show up for session "${session_name}"`,
        booking_id
      );
    } else if (status === 'confirmed') {
      if (therapist_id) {
        await notifyTherapist(
          therapist_id,
          'new_booking',
          'New Booking Assigned',
          `New session "${session_name}" booked with ${client_name}`,
          booking_id
        );
      }
      
      await notifyAllAdmins(
        'new_booking',
        'New Booking',
        `New session "${session_name}" booked with ${client_name}`,
        booking_id
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
}

async function handleSessionNotesSubmit(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { booking_id, therapist_id, therapist_name, client_name } = req.body;
  
  try {
    // Notify admins about session notes submission
    await notifyAllAdmins(
      'session_notes_submitted',
      'Session Notes Submitted',
      `${therapist_name} submitted session notes for ${client_name}`,
      booking_id
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling session notes:', error);
    res.status(500).json({ error: 'Failed to process session notes' });
  }
}

async function handleBookingWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { booking_id, client_name, session_name, therapist_name, therapist_id } = req.body;
  
  try {
    // Notify therapist about new booking
    if (therapist_id) {
      await notifyTherapist(
        therapist_id,
        'new_booking',
        'New Booking Assigned',
        `New session "${session_name}" booked with ${client_name}`,
        booking_id
      );
    }
    
    // Notify admins
    await notifyAllAdmins(
      'new_booking',
      'New Booking Created',
      `${client_name} booked "${session_name}" with ${therapist_name}`,
      booking_id
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling booking webhook:', error);
    res.status(500).json({ error: 'Failed to process booking webhook' });
  }
}

async function handleRefundStatus(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { booking_id, refund_status, client_name, therapist_id, refund_amount } = req.body;
  
  try {
    await pool.query('UPDATE bookings SET refund_status = $1 WHERE booking_id = $2', [refund_status, booking_id]);
    
    if (refund_status === 'completed' || refund_status === 'processed') {
      // Notify admins only
      await notifyAllAdmins(
        'refund_processed',
        'Refund Completed',
        `Refund of ₹${refund_amount} processed for ${client_name}`,
        booking_id
      );
    } else if (refund_status === 'requested') {
      await notifyAllAdmins(
        'refund_requested',
        'Refund Requested',
        `${client_name} requested a refund of ₹${refund_amount}`,
        booking_id
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating refund status:', error);
    res.status(500).json({ error: 'Failed to update refund status' });
  }
}

async function handleClientDetails(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email, phone } = req.query;
  
  console.log('Client details request - email:', email, 'phone:', phone);
  
  if (!email && !phone) {
    return res.status(400).json({ error: 'Client email or phone is required' });
  }
  
  try {
    let query = `
      SELECT 
        invitee_name,
        booking_resource_name,
        booking_start_at,
        booking_invitee_time,
        booking_host_name,
        booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE 1=0
    `;
    const params: any[] = [];
    
    if (email) {
      params.push(email);
      query += ` OR LOWER(b.invitee_email) = LOWER($${params.length})`;
    }
    
    if (phone) {
      params.push(phone);
      query += ` OR b.invitee_phone = $${params.length}`;
    }
    
    query += ' ORDER BY b.booking_start_at DESC';
    
    console.log('Executing query:', query, 'with params:', params);
    const appointmentsResult = await pool.query(query, params);
    console.log('Found appointments:', appointmentsResult.rows.length);
    
    const appointments = appointmentsResult.rows.map(apt => {
      let status = apt.booking_status || 'confirmed';
      const now = new Date();
      const sessionDate = apt.booking_start_at ? new Date(apt.booking_start_at) : new Date();
      
      if (status !== 'cancelled' && status !== 'no_show') {
        if (apt.has_session_notes) {
          status = 'completed';
        } else if (sessionDate < now) {
          status = 'pending_notes';
        } else {
          status = 'scheduled';
        }
      }
      
      return {
        ...apt,
        booking_invitee_time: apt.booking_invitee_time || 'N/A',
        booking_status: status,
        booking_start_at_raw: apt.booking_start_at
      };
    });
    
    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
}

async function handleClientAppointments(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const { client_phone, therapist_id } = req.query;
  
  if (!client_phone) {
    return res.status(400).json({ error: 'Client phone is required' });
  }
  
  try {
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

    const query = therapistFirstName
      ? `SELECT b.booking_id, b.booking_invitee_time as session_timings, b.booking_mode as mode,
          b.booking_start_at as booking_date, b.booking_status,
          CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
        FROM bookings b LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
        WHERE b.invitee_phone = $1 AND b.booking_host_name ILIKE $2
        ORDER BY b.booking_start_at DESC`
      : `SELECT b.booking_id, b.booking_invitee_time as session_timings, b.booking_mode as mode,
          b.booking_start_at as booking_date, b.booking_status,
          CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
        FROM bookings b LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
        WHERE b.invitee_phone = $1 ORDER BY b.booking_start_at DESC`;

    const params = therapistFirstName ? [client_phone, `%${therapistFirstName}%`] : [client_phone];
    const appointmentsResult = await pool.query(query, params);

    const appointments = appointmentsResult.rows.map(row => ({
      booking_id: row.booking_id,
      session_timings: convertToIST(row.session_timings),
      mode: row.mode ? row.mode.replace(/\s*\(.*?\)\s*/g, '').split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Google Meet',
      has_session_notes: row.has_session_notes,
      booking_status: row.booking_status
    }));

    res.json({ appointments });
  } catch (error) {
    console.error('Client appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch client appointments' });
  }
}
