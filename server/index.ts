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
    const revenue = await pool.query(`
      SELECT COALESCE(SUM(invitee_payment_amount), 0) as total
      FROM bookings 
      WHERE booking_status != 'cancelled'
    `);

    const sessions = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status IN ('confirmed', 'rescheduled')
    `);

    const freeConsultations = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE invitee_payment_amount = 0 OR invitee_payment_amount IS NULL
    `);

    const cancelled = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'cancelled'
    `);

    const refunds = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE refund_status IN ('completed', 'processed')
    `);

    const noShows = await pool.query(`
      SELECT COUNT(*) as total
      FROM bookings 
      WHERE booking_status = 'no_show'
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
    const result = await pool.query(`
      SELECT 
        invitee_name as client_name,
        booking_resource_name as therapy_type,
        booking_mode as mode,
        booking_host_name as therapist_name,
        booking_start_at,
        booking_end_at
      FROM bookings
      WHERE booking_status != 'cancelled'
        AND booking_start_at >= CURRENT_DATE
      ORDER BY booking_start_at ASC
      LIMIT 10
    `);

    res.json(result.rows);
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
        COUNT(*) as session_count
      FROM bookings
      GROUP BY invitee_name, invitee_phone, invitee_email, booking_host_name
      ORDER BY invitee_name
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
        booking_start_at,
        booking_resource_name,
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name,
        booking_mode
      FROM bookings
      ORDER BY booking_start_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
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
        COUNT(b.booking_id) FILTER (WHERE b.booking_status != 'cancelled') as sessions_booked
      FROM therapists t
      LEFT JOIN bookings b ON t.therapist_id = b.booking_host_user_id
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
