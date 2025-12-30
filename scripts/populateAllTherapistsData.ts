import pool from '../lib/db';

async function populateAllTherapistsData() {
  try {
    const therapistIds = ['58768', '59507', '59509', '58769', '59508', '59510'];
    
    for (const therapistId of therapistIds) {
      console.log(`\nPopulating data for therapist ${therapistId}...`);

      // Insert clients summary
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

      await pool.query('DELETE FROM therapist_clients_summary WHERE therapist_id = $1', [therapistId]);

      for (const client of clientsResult.rows) {
        await pool.query(`
          INSERT INTO therapist_clients_summary 
          (therapist_id, client_name, client_email, client_phone, total_sessions, last_session_date)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [therapistId, client.client_name, client.client_email, client.client_phone, client.total_sessions, client.last_session_date]);
      }

      console.log(`  ✓ Inserted ${clientsResult.rows.length} clients`);

      // Insert appointments cache
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

      console.log(`  ✓ Inserted ${appointmentsResult.rows.length} appointments`);
    }

    console.log('\n✅ Successfully populated data for all therapists!');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

populateAllTherapistsData();
