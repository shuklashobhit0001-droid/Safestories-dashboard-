import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from '../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract route from URL path
  const urlPath = req.url?.split('?')[0] || '';
  const route = urlPath.replace('/api/', '').replace('/api/index', '') || req.query.route as string;
  
  if (!route || route === 'index') {
    return res.status(400).json({ error: 'Route parameter required' });
  }

  try {
    switch (route) {
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
      case 'therapist-details':
        return await handleTherapistDetails(req, res);
      case 'therapist-stats':
        return await handleTherapistStats(req, res);
      case 'dashboard/bookings':
        return await handleDashboardBookings(req, res);
      case 'dashboard/stats':
        return await handleDashboardStats(req, res);
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
    res.json({ success: true, user: result.rows[0] });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
}

async function handleTherapists(req: VercelRequest, res: VercelResponse) {
  const result = await pool.query(`
    SELECT t.therapist_id, t.name, t.specialization, t.contact_info,
      COUNT(DISTINCT b.booking_id) as total_sessions_lifetime,
      COUNT(DISTINCT CASE WHEN EXTRACT(MONTH FROM b.booking_start_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM b.booking_start_at) = EXTRACT(YEAR FROM CURRENT_DATE) THEN b.booking_id END) as sessions_this_month
    FROM therapists t
    LEFT JOIN bookings b ON TRIM(b.booking_host_name) ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
    GROUP BY t.therapist_id, t.name, t.specialization, t.contact_info
    ORDER BY t.name ASC
  `);
  res.json(result.rows);
}

async function handleClients(req: VercelRequest, res: VercelResponse) {
  const result = await pool.query(`
    SELECT invitee_name, invitee_phone, invitee_email, booking_host_name, COUNT(*) as session_count, MAX(invitee_created_at) as created_at
    FROM bookings GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name
    UNION ALL
    SELECT client_name as invitee_name, client_whatsapp as invitee_phone, client_email as invitee_email, 
      therapist_name as booking_host_name, 0 as session_count, created_at
    FROM booking_requests
  `);
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
      clientMap.set(key, { invitee_name: row.invitee_name, invitee_phone: row.invitee_phone, invitee_email: row.invitee_email,
        session_count: 0, booking_host_name: row.booking_host_name, created_at: row.created_at, therapists: [] });
    }
    const client = clientMap.get(key);
    client.session_count += parseInt(row.session_count) || 0;
    client.therapists.push({ invitee_name: row.invitee_name, invitee_phone: row.invitee_phone, 
      booking_host_name: row.booking_host_name, session_count: parseInt(row.session_count) || 0 });
  });
  const clients = Array.from(clientMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(clients);
}

async function handleAppointments(req: VercelRequest, res: VercelResponse) {
  const result = await pool.query(`
    SELECT booking_invitee_time, booking_resource_name, invitee_name, invitee_phone, invitee_email, 
      booking_host_name, booking_mode, booking_start_at, booking_joining_link, booking_checkin_url
    FROM bookings ORDER BY booking_start_at DESC
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
    ...row, booking_start_at: convertToIST(row.booking_invitee_time),
    booking_mode: row.booking_mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    booking_joining_link: row.booking_joining_link, booking_checkin_url: row.booking_checkin_url
  }));
  res.json(appointments);
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
  let query = `SELECT r.client_name, r.session_name, r.session_timings, b.refund_status, b.invitee_phone, b.invitee_email, b.refund_amount
    FROM refund_cancellation_table r LEFT JOIN bookings b ON r.session_id = b.booking_id WHERE b.refund_status IS NOT NULL`;
  if (status && status !== 'all') {
    const result = await pool.query(query + ' AND b.refund_status = $1 ORDER BY r.session_timings DESC', [status]);
    return res.status(200).json(result.rows);
  }
  const result = await pool.query(query + ' ORDER BY r.session_timings DESC');
  res.status(200).json(result.rows);
}

async function handleBookingRequests(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation } = req.body;
  const result = await pool.query(
    `INSERT INTO booking_requests (client_name, client_whatsapp, client_email, therapy_type, therapist_name, booking_link, status, is_free_consultation)
     VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7) RETURNING *`,
    [clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink, isFreeConsultation || false]
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
  const appointmentsResult = await pool.query('SELECT * FROM therapist_appointments_cache WHERE therapist_id = $1 ORDER BY booking_date DESC', [therapistUserId]);
  
  const convertToIST = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
    if (!match) return timeStr;
    const [, date, startTime, endTime, offset] = match;
    const parseTime = (time: string) => {
      const [h, rest] = time.split(':');
      const [m, period] = rest.split(' ');
      let hour = parseInt(h);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      const [offsetHours, offsetMins] = offset.replace('GMT', '').split(':').map(n => parseInt(n));
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
    const istStart = parseTime(startTime);
    const istEnd = parseTime(endTime);
    return `${date} at ${istStart} - ${istEnd} IST`;
  };
  
  const appointments = appointmentsResult.rows.map(apt => ({
    ...apt,
    session_timings: convertToIST(apt.session_timings)
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
  const clientsResult = await pool.query('SELECT * FROM therapist_clients_summary WHERE therapist_id = $1 ORDER BY last_session_date DESC', [therapistUserId]);
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
      clientMap.set(key, { client_name: row.client_name, client_phone: row.client_phone, client_email: row.client_email, total_sessions: 0, therapists: [] });
    }
    const client = clientMap.get(key);
    client.total_sessions += parseInt(row.total_sessions) || 0;
    client.therapists.push({ client_name: row.client_name, client_phone: row.client_phone, total_sessions: parseInt(row.total_sessions) || 0 });
  });
  const clients = Array.from(clientMap.values());
  res.json({ clients });
}

async function handleTherapistDetails(req: VercelRequest, res: VercelResponse) {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Therapist name is required' });
  const clientsResult = await pool.query(`
    WITH client_data AS (
      SELECT DISTINCT invitee_name, invitee_email, invitee_phone
      FROM bookings WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
    )
    SELECT invitee_name, invitee_email, STRING_AGG(DISTINCT invitee_phone, ', ') as invitee_phone
    FROM client_data GROUP BY invitee_name, invitee_email ORDER BY invitee_name
  `, [name]);
  const appointmentsResult = await pool.query(`
    SELECT invitee_name, booking_resource_name, booking_start_at, booking_invitee_time
    FROM bookings WHERE booking_host_name ILIKE '%' || SPLIT_PART($1, ' ', 1) || '%'
    ORDER BY booking_start_at DESC LIMIT 10
  `, [name]);
  
  const convertToIST = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
    if (!match) return timeStr;
    const [, date, startTime, endTime, offset] = match;
    const parseTime = (time: string) => {
      const [h, rest] = time.split(':');
      const [m, period] = rest.split(' ');
      let hour = parseInt(h);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      const [offsetHours, offsetMins] = offset.replace('GMT', '').split(':').map(n => parseInt(n));
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
    const istStart = parseTime(startTime);
    const istEnd = parseTime(endTime);
    return `${date} at ${istStart} - ${istEnd} IST`;
  };
  
  const appointments = appointmentsResult.rows.map(apt => ({
    ...apt,
    booking_invitee_time: convertToIST(apt.booking_invitee_time)
  }));
  
  res.json({ clients: clientsResult.rows, appointments });
}

async function handleTherapistStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { therapist_id } = req.query;
  if (!therapist_id) return res.status(400).json({ error: 'Therapist ID is required' });
  const userResult = await pool.query('SELECT therapist_id FROM users WHERE id = $1 AND role = $2', [therapist_id, 'therapist']);
  if (userResult.rows.length === 0) return res.status(404).json({ error: 'Therapist user not found' });
  const therapistUserId = userResult.rows[0].therapist_id;
  const statsResult = await pool.query('SELECT * FROM therapist_dashboard_stats WHERE therapist_id = $1', [therapistUserId]);
  if (statsResult.rows.length === 0) return res.status(404).json({ error: 'Therapist stats not found' });
  const stats = statsResult.rows[0];
  const upcomingResult = await pool.query(`
    SELECT * FROM therapist_appointments_cache WHERE therapist_id = $1 AND booking_date > NOW() AND booking_status = 'confirmed'
    ORDER BY booking_date ASC LIMIT 10
  `, [therapistUserId]);
  const therapistResult = await pool.query('SELECT * FROM therapists WHERE therapist_id = $1', [therapistUserId]);
  const therapist = therapistResult.rows[0] || { name: 'Ishika Mahajan', specialization: 'Individual Therapy' };
  
  const convertToIST = (timeStr: string) => {
    if (!timeStr) return timeStr;
    const match = timeStr.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M) \(GMT([+-]\d+:\d+)\)/);
    if (!match) return timeStr;
    const [, date, startTime, endTime, offset] = match;
    const parseTime = (time: string) => {
      const [h, rest] = time.split(':');
      const [m, period] = rest.split(' ');
      let hour = parseInt(h);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      const [offsetHours, offsetMins] = offset.replace('GMT', '').split(':').map(n => parseInt(n));
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
    const istStart = parseTime(startTime);
    const istEnd = parseTime(endTime);
    return `${date} at ${istStart} - ${istEnd} IST`;
  };
  
  res.json({
    therapist: { name: therapist.name, specialization: therapist.specialization },
    stats: { sessions: parseInt(stats.confirmed_sessions) || 0, noShows: parseInt(stats.no_shows) || 0, cancelled: parseInt(stats.cancelled_sessions) || 0 },
    upcomingBookings: upcomingResult.rows.map(booking => ({
      client_name: booking.client_name, therapy_type: booking.session_name, mode: booking.mode, session_timings: convertToIST(booking.session_timings)
    }))
  });
}

async function handleDashboardBookings(req: VercelRequest, res: VercelResponse) {
  const { start, end } = req.query;
  const dateFilter = start && end ? `AND booking_start_at BETWEEN '${start}' AND '${end} 23:59:59'` : 'AND booking_end_at >= NOW()';
  const result = await pool.query(`
    SELECT invitee_name as client_name, booking_resource_name as therapy_type, booking_mode as mode, 
      booking_host_name as therapist_name, booking_invitee_time
    FROM bookings WHERE booking_status != 'cancelled' ${dateFilter} ORDER BY booking_start_at ASC LIMIT 10
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
  const bookings = result.rows.map(row => ({
    ...row, booking_start_at: convertToIST(row.booking_invitee_time),
    mode: row.mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));
  res.json(bookings);
}

async function handleDashboardStats(req: VercelRequest, res: VercelResponse) {
  const { start, end } = req.query;
  const dateFilter = start && end ? `AND invitee_created_at BETWEEN '${start}' AND '${end} 23:59:59'` : '';
  const revenue = await pool.query(`SELECT COALESCE(SUM(invitee_payment_amount), 0) as total FROM bookings WHERE booking_status != 'cancelled' ${dateFilter}`);
  const sessions = await pool.query(`SELECT COUNT(invitee_created_at) as total FROM bookings WHERE booking_status IN ('confirmed', 'rescheduled') ${dateFilter}`);
  const freeConsultations = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) ${dateFilter}`);
  const cancelled = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE booking_status = 'cancelled' ${dateFilter}`);
  const refunds = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE refund_status IN ('completed', 'processed') ${dateFilter}`);
  const noShows = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE booking_status = 'no_show' ${dateFilter}`);
  res.json({
    revenue: revenue.rows[0].total, sessions: sessions.rows[0].total, freeConsultations: freeConsultations.rows[0].total,
    cancelled: cancelled.rows[0].total, refunds: refunds.rows[0].total, noShows: noShows.rows[0].total
  });
}
