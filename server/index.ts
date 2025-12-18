import express from 'express';
import cors from 'cors';
import pool from '../lib/db';

const app = express();
app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
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
    const dateFilter = start && end ? `AND booking_start_at BETWEEN '${start}' AND '${end} 23:59:59'` : '';

    const revenue = await pool.query(`
      SELECT COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status != 'cancelled' ${dateFilter}
    `);

    const sessions = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status IN ('confirmed', 'rescheduled') ${dateFilter}
    `);

    const freeConsultations = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL) ${dateFilter}
    `);

    const cancelled = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'cancelled' ${dateFilter}
    `);

    const refunds = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE refund_status IN ('completed', 'processed') ${dateFilter}
    `);

    const noShows = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'no_show' ${dateFilter}
    `);

    res.json({
      revenue: revenue.rows[0].total,
      sessions: sessions.rows[0].total,
      freeConsultations: freeConsultations.rows[0].total,
      cancelled: cancelled.rows[0].total,
      refunds: refunds.rows[0].total,
      noShows: noShows.rows[0].total,
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
    const dateFilter = start && end 
      ? `AND booking_start_at BETWEEN '${start}' AND '${end} 23:59:59'`
      : 'AND booking_start_at >= CURRENT_DATE';

    const result = await pool.query(`
      SELECT 
        invitee_name as client_name,
        booking_resource_name as therapy_type,
        booking_mode as mode,
        booking_host_name as therapist_name,
        booking_invitee_time
      FROM bookings
      WHERE booking_status != 'cancelled'
        ${dateFilter}
      ORDER BY booking_start_at ASC
      LIMIT 10
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
        client_name as invitee_name,
        phone_number as invitee_phone,
        email_id as invitee_email,
        assigned_therapist as booking_host_name,
        no_of_sessions as session_count
      FROM all_clients_table
      ORDER BY client_name
    `);

    res.json(result.rows);
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
        booking_start_at
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
      booking_mode: row.booking_mode.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
    const { clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink } = req.body;

    const result = await pool.query(
      `INSERT INTO booking_requests (client_name, client_whatsapp, client_email, therapy_type, therapist_name, booking_link, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent')
       RETURNING *`,
      [clientName, clientWhatsapp, clientEmail, therapyType, therapistName, bookingLink]
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
        t.capacity,
        COUNT(a.session_id) as sessions_booked
      FROM therapists t
      LEFT JOIN appointment_table a ON t.therapist_id = a.therapist_id
      GROUP BY t.therapist_id, t.name, t.specialization, t.contact_info, t.capacity
      ORDER BY t.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
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
