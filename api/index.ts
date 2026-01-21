import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';
import { notifyAllAdmins, notifyTherapist } from '../lib/notifications.js';
import { convertToIST } from '../lib/timezone.js';

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
  const route = urlPath.replace('/api/', '').replace('/api/index', '') || req.query.route as string;
  
  if (!route || route === 'index') {
    return res.status(400).json({ error: 'Route parameter required' });
  }

  try {
    switch (route) {
      case 'live-sessions-count':
        return await handleLiveSessionsCount(req, res);
      case 'therapists-live-status':
        return await handleTherapistsLiveStatus(req, res);
      case 'login':
        return await handleLogin(req, res);
      case 'therapists':
        return await handleTherapists(req, res);
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

async function handleLiveSessionsCount(req: VercelRequest, res: VercelResponse) {
  try {
    const bookings = await pool.query(`
      SELECT booking_id, booking_invitee_time, booking_status
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
      AND booking_invitee_time IS NOT NULL
    `);

    const now = new Date();
    let liveCount = 0;

    for (const booking of bookings.rows) {
      try {
        const timeMatch = booking.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M)/i);
        if (!timeMatch) continue;
        
        const dateStr = timeMatch[1];
        const timeStr = timeMatch[2];
        const startTime = new Date(`${dateStr} ${timeStr} GMT+0530`);
        const endTime = new Date(startTime.getTime() + 50 * 60 * 1000);
        
        if (now >= startTime && now <= endTime) {
          liveCount++;
        }
      } catch (error) {
        console.error('Error parsing booking time:', error);
      }
    }

    res.json({ liveCount });
  } catch (error) {
    console.error('Error fetching live sessions count:', error);
    res.status(500).json({ error: 'Failed to fetch live sessions count' });
  }
}

async function handleTherapistsLiveStatus(req: VercelRequest, res: VercelResponse) {
  try {
    const bookings = await pool.query(`
      SELECT booking_host_name, booking_invitee_time, booking_status
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
      AND booking_invitee_time IS NOT NULL
    `);

    const now = new Date();
    const liveStatus: { [key: string]: boolean } = {};

    for (const booking of bookings.rows) {
      try {
        const timeMatch = booking.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M)/i);
        if (!timeMatch) continue;
        
        const dateStr = timeMatch[1];
        const timeStr = timeMatch[2];
        const startTime = new Date(`${dateStr} ${timeStr} GMT+0530`);
        const endTime = new Date(startTime.getTime() + 50 * 60 * 1000);
        
        if (now >= startTime && now <= endTime) {
          liveStatus[booking.booking_host_name] = true;
        }
      } catch (error) {
        console.error('Error parsing booking time:', error);
      }
    }

    res.json(liveStatus);
  } catch (error) {
    console.error('Error fetching therapists live status:', error);
    res.status(500).json({ error: 'Failed to fetch therapists live status' });
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
      let status = row.booking_status;
      const now = new Date();
      const sessionDate = new Date(row.booking_start_at);
      
      if (row.booking_status !== 'cancelled' && row.booking_status !== 'canceled' && row.booking_status !== 'no_show' && row.booking_status !== 'no show') {
        if (row.has_session_notes) {
          status = 'completed';
        } else if (sessionDate < now) {
          status = 'pending_notes';
        }
      }
          const [h, rest] = startTime.split(':');
          const [m, period] = rest.split(' ');
          let hour = parseInt(h);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          const originalDate = new Date(Date.UTC(parseInt(year), monthMap[month], parseInt(day), hour, parseInt(m)));
          const [offsetHours, offsetMins] = offset.split(':').map(n => parseInt(n));
          const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
          const istOffset = 330;
          const diffMinutes = istOffset - offsetTotal;
          const istDate = new Date(originalDate.getTime() + diffMinutes * 60 * 1000);
          const istEndDate = new Date(istDate.getTime() + 50 * 60 * 1000);
          const formatDate = (d: Date) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
          };
          const formatTime = (d: Date) => {
            const hours = d.getUTCHours();
            const minutes = d.getUTCMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          };
          return `${formatDate(istDate)} at ${formatTime(istDate)} - ${formatTime(istEndDate)} IST`;
        } catch (error) {
          console.error('Error converting time:', error);
          return timeStr;
        }
      };
  
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
    ORDER BY booking_start_at DESC LIMIT 10
  `, [name]);
          const [h, rest] = startTime.split(':');
          const [m, period] = rest.split(' ');
          let hour = parseInt(h);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          const originalDate = new Date(Date.UTC(parseInt(year), monthMap[month], parseInt(day), hour, parseInt(m)));
          const [offsetHours, offsetMins] = offset.split(':').map(n => parseInt(n));
          const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
          const istOffset = 330;
          const diffMinutes = istOffset - offsetTotal;
          const istDate = new Date(originalDate.getTime() + diffMinutes * 60 * 1000);
          const istEndDate = new Date(istDate.getTime() + 50 * 60 * 1000);
          const formatDate = (d: Date) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
          };
          const formatTime = (d: Date) => {
            const hours = d.getUTCHours();
            const minutes = d.getUTCMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          };
          return `${formatDate(istDate)} at ${formatTime(istDate)} - ${formatTime(istEndDate)} IST`;
        } catch (error) {
          console.error('Error converting time:', error);
          return timeStr;
        }
      };
  
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
          const [h, rest] = startTime.split(':');
          const [m, period] = rest.split(' ');
          let hour = parseInt(h);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          const originalDate = new Date(Date.UTC(parseInt(year), monthMap[month], parseInt(day), hour, parseInt(m)));
          const [offsetHours, offsetMins] = offset.split(':').map(n => parseInt(n));
          const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
          const istOffset = 330;
          const diffMinutes = istOffset - offsetTotal;
          const istDate = new Date(originalDate.getTime() + diffMinutes * 60 * 1000);
          const istEndDate = new Date(istDate.getTime() + 50 * 60 * 1000);
          const formatDate = (d: Date) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
          };
          const formatTime = (d: Date) => {
            const hours = d.getUTCHours();
            const minutes = d.getUTCMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          };
          return `${formatDate(istDate)} at ${formatTime(istDate)} - ${formatTime(istEndDate)} IST`;
        } catch (error) {
          console.error('Error converting time:', error);
          return timeStr;
        }
      };
  
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

async function handleDashboardStats(req: VercelRequest, res: VercelResponse) {
  try {
    const { start, end } = req.query;
    const hasDateFilter = start && end;
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const revenue = hasDateFilter
      ? await pool.query('SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['cancelled', 'canceled', start, `${end} 23:59:59`])
      : await pool.query('SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status NOT IN ($1, $2)', ['cancelled', 'canceled']);

    const sessions = hasDateFilter
      ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['confirmed', 'rescheduled', start, `${end} 23:59:59`])
      : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)', ['confirmed', 'rescheduled']);

    const freeConsultations = hasDateFilter
      ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`])
      : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)');

    const cancelled = hasDateFilter
      ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['cancelled', 'canceled', start, `${end} 23:59:59`])
      : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)', ['cancelled', 'canceled']);

    const refunds = hasDateFilter
      ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`])
      : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE refund_status IS NOT NULL');

    const refundedAmount = hasDateFilter
      ? await pool.query('SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL AND booking_start_at BETWEEN $1 AND $2',
          [start, `${end} 23:59:59`])
      : await pool.query('SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IS NOT NULL');

    const noShows = hasDateFilter
      ? await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
          ['no_show', 'no show', start, `${end} 23:59:59`])
      : await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2)', ['no_show', 'no show']);

    const lastMonthSessions = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['confirmed', 'rescheduled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);

    const lastMonthFreeConsultations = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) AND booking_start_at BETWEEN $1 AND $2',
      [lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);

    const lastMonthCancelled = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['cancelled', 'canceled', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);

    const lastMonthRefunds = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE refund_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['completed', 'processed', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);

    const lastMonthNoShows = await pool.query('SELECT COUNT(*) as total FROM bookings WHERE booking_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['no_show', 'no show', lastMonthStart.toISOString(), lastMonthEnd.toISOString()]);

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
        FROM bookings WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') AND booking_start_at >= NOW()
        ORDER BY booking_start_at ASC LIMIT 10
      `);
          const [h, rest] = startTime.split(':');
          const [m, period] = rest.split(' ');
          let hour = parseInt(h);
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          const originalDate = new Date(Date.UTC(parseInt(year), monthMap[month], parseInt(day), hour, parseInt(m)));
          const [offsetHours, offsetMins] = offset.split(':').map(n => parseInt(n));
          const offsetTotal = offsetHours * 60 + (offsetHours < 0 ? -offsetMins : offsetMins);
          const istOffset = 330;
          const diffMinutes = istOffset - offsetTotal;
          const istDate = new Date(originalDate.getTime() + diffMinutes * 60 * 1000);
          const istEndDate = new Date(istDate.getTime() + 50 * 60 * 1000);
          const formatDate = (d: Date) => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
          };
          const formatTime = (d: Date) => {
            const hours = d.getUTCHours();
            const minutes = d.getUTCMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
          };
          return `${formatDate(istDate)} at ${formatTime(istDate)} - ${formatTime(istEndDate)} IST`;
        } catch (error) {
          console.error('Error converting time:', error);
          return timeStr;
        }
      };

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
