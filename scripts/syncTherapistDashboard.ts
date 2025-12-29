import pool from '../lib/db';

async function syncTherapistDashboardData(therapistId: string = '58768') {
  try {
    console.log(`Syncing dashboard data for therapist ${therapistId}...`);

    // 1. Update stats
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

    console.log('✓ Updated stats');

    // 2. Update clients
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
    `, [therapistId]);

    await pool.query('DELETE FROM therapist_clients_summary WHERE therapist_id = $1', [therapistId]);

    for (const client of clientsResult.rows) {
      await pool.query(`
        INSERT INTO therapist_clients_summary 
        (therapist_id, client_name, client_email, client_phone, total_sessions, last_session_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [therapistId, client.client_name, client.client_email, client.client_phone, client.total_sessions, client.last_session_date]);
    }

    console.log('✓ Updated clients');

    // 3. Update appointments
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

    await pool.query('DELETE FROM therapist_appointments_cache WHERE therapist_id = $1', [therapistId]);

    for (const appointment of appointmentsResult.rows) {
      await pool.query(`
        INSERT INTO therapist_appointments_cache 
        (therapist_id, session_timings, session_name, client_name, contact_info, mode, booking_date, booking_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [therapistId, appointment.session_timings, appointment.session_name, appointment.client_name, appointment.contact_info, appointment.mode, appointment.booking_date, appointment.booking_status]);
    }

    console.log('✓ Updated appointments');
    console.log('✅ Dashboard data sync completed!');
    
  } catch (error) {
    console.error('Error syncing dashboard data:', error);
    throw error;
  }
}

// Run sync if called directly
if (require.main === module) {
  syncTherapistDashboardData().then(() => {
    pool.end();
  }).catch((error) => {
    console.error('Sync failed:', error);
    process.exit(1);
  });
}

export { syncTherapistDashboardData };