import pool from '../lib/db';

async function populateIshikaData() {
  try {
    const therapistId = '58768'; // Ishika's therapist ID
    console.log('Populating Ishika\'s dashboard data...');

    // 1. Calculate and insert stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed_sessions,
        COUNT(CASE WHEN booking_status = 'cancelled' THEN 1 END) as cancelled_sessions,
        COUNT(CASE WHEN booking_status = 'no_show' THEN 1 END) as no_shows
      FROM bookings 
      WHERE booking_host_user_id = $1
    `, [therapistId]);

    const upcomingResult = await pool.query(`
      SELECT COUNT(*) as upcoming_count
      FROM bookings 
      WHERE booking_host_user_id = $1 
        AND booking_start_at > NOW()
        AND booking_status = 'confirmed'
    `, [therapistId]);

    const stats = statsResult.rows[0];
    const upcomingCount = upcomingResult.rows[0].upcoming_count;

    // Insert/Update stats
    await pool.query(`
      INSERT INTO therapist_dashboard_stats 
      (therapist_id, total_sessions, confirmed_sessions, cancelled_sessions, no_shows, upcoming_bookings, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (therapist_id) 
      DO UPDATE SET 
        total_sessions = $2,
        confirmed_sessions = $3,
        cancelled_sessions = $4,
        no_shows = $5,
        upcoming_bookings = $6,
        last_updated = NOW()
    `, [therapistId, stats.total_sessions, stats.confirmed_sessions, stats.cancelled_sessions, stats.no_shows, upcomingCount]);

    console.log('✓ Inserted stats:', stats);

    // 2. Insert clients summary
    const clientsResult = await pool.query(`
      SELECT DISTINCT 
        invitee_name as client_name,
        invitee_email as client_email,
        invitee_phone as client_phone,
        COUNT(*) as total_sessions,
        MAX(booking_start_at) as last_session_date
      FROM bookings 
      WHERE booking_host_user_id = $1
      GROUP BY invitee_name, invitee_email, invitee_phone
      ORDER BY last_session_date DESC
    `, [therapistId]);

    // Clear existing clients data
    await pool.query('DELETE FROM therapist_clients_summary WHERE therapist_id = $1', [therapistId]);

    // Insert clients
    for (const client of clientsResult.rows) {
      await pool.query(`
        INSERT INTO therapist_clients_summary 
        (therapist_id, client_name, client_email, client_phone, total_sessions, last_session_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [therapistId, client.client_name, client.client_email, client.client_phone, client.total_sessions, client.last_session_date]);
    }

    console.log('✓ Inserted', clientsResult.rows.length, 'clients');

    // 3. Insert appointments cache
    const appointmentsResult = await pool.query(`
      SELECT 
        booking_invitee_time as session_timings,
        booking_resource_name as session_name,
        invitee_name as client_name,
        invitee_phone as contact_info,
        booking_mode as mode,
        booking_start_at as booking_date,
        booking_status
      FROM bookings 
      WHERE booking_host_user_id = $1
      ORDER BY booking_start_at DESC
    `, [therapistId]);

    // Clear existing appointments data
    await pool.query('DELETE FROM therapist_appointments_cache WHERE therapist_id = $1', [therapistId]);

    // Insert appointments
    for (const appointment of appointmentsResult.rows) {
      await pool.query(`
        INSERT INTO therapist_appointments_cache 
        (therapist_id, session_timings, session_name, client_name, contact_info, mode, booking_date, booking_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [therapistId, appointment.session_timings, appointment.session_name, appointment.client_name, appointment.contact_info, appointment.mode, appointment.booking_date, appointment.booking_status]);
    }

    console.log('✓ Inserted', appointmentsResult.rows.length, 'appointments');

    console.log('\n✅ Successfully populated all Ishika\'s dashboard data!');
    
    await pool.end();
  } catch (error) {
    console.error('Error populating data:', error);
    process.exit(1);
  }
}

populateIshikaData();