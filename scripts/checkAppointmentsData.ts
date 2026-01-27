import pool from '../lib/db';

async function checkAppointmentsData() {
  try {
    console.log('=== CHECKING APPOINTMENTS DATA ===\n');

    // Get the 6 appointments shown in UI
    const appointments = [
      { name: 'Meera', date: '2026-02-04' },
      { name: 'Siddharth Gautam', date: '2026-01-29' },
      { name: 'Nikita Jain', date: '2026-01-27' },
      { name: 'Muskan', date: '2026-01-27' },
      { name: 'Samara Grewal', date: '2026-01-27' },
      { name: 'Simone Pinto', date: '2026-01-27' }
    ];

    for (const apt of appointments) {
      console.log(`\n=== ${apt.name} - ${apt.date} ===`);
      
      const result = await pool.query(`
        SELECT 
          booking_id,
          invitee_name,
          booking_invitee_time,
          booking_start_at,
          booking_end_at,
          booking_resource_name,
          booking_host_name,
          booking_mode,
          booking_status,
          invitee_phone,
          invitee_email
        FROM bookings 
        WHERE invitee_name ILIKE $1
        AND booking_start_at::date = $2
        ORDER BY booking_start_at
      `, [`%${apt.name}%`, apt.date]);

      if (result.rows.length === 0) {
        console.log('❌ NOT FOUND IN DATABASE');
        continue;
      }

      const row = result.rows[0];
      
      console.log('📊 DATABASE VALUES:');
      console.log(`  booking_id: ${row.booking_id}`);
      console.log(`  invitee_name: ${row.invitee_name}`);
      console.log(`  booking_invitee_time: ${row.booking_invitee_time}`);
      console.log(`  booking_start_at: ${row.booking_start_at}`);
      console.log(`  booking_end_at: ${row.booking_end_at}`);
      console.log(`  booking_resource_name: ${row.booking_resource_name}`);
      console.log(`  booking_host_name: ${row.booking_host_name}`);
      console.log(`  booking_mode: ${row.booking_mode}`);
      console.log(`  booking_status: ${row.booking_status}`);
      
      // Parse the times
      const startDate = new Date(row.booking_start_at);
      const endDate = new Date(row.booking_end_at);
      
      console.log('\n⏰ TIME ANALYSIS:');
      console.log(`  DB Start (UTC): ${startDate.toISOString()}`);
      console.log(`  DB Start (Local): ${startDate.toString()}`);
      console.log(`  DB End (UTC): ${endDate.toISOString()}`);
      console.log(`  DB End (Local): ${endDate.toString()}`);
      
      // Calculate IST (UTC+5:30)
      const istStart = new Date(startDate.getTime() + (5.5 * 60 * 60 * 1000));
      const istEnd = new Date(endDate.getTime() + (5.5 * 60 * 60 * 1000));
      
      console.log(`  IST Start: ${istStart.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  IST End: ${istEnd.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      
      // Format like UI
      const formatTime = (d: Date) => {
        const hours = d.getHours();
        const minutes = d.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      };
      
      const weekday = startDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
      const month = startDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'Asia/Kolkata' });
      const day = startDate.getDate();
      const year = startDate.getFullYear();
      
      const uiFormat = `${weekday}, ${month} ${day}, ${year} at ${formatTime(startDate)} - ${formatTime(endDate)} IST`;
      console.log(`\n📱 UI FORMAT: ${uiFormat}`);
      console.log(`📝 booking_invitee_time: ${row.booking_invitee_time}`);
    }

    console.log('\n\n=== SUMMARY ===');
    console.log('Checking what API returns vs what DB has...\n');

    const apiQuery = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_invitee_time,
        booking_start_at,
        booking_host_name
      FROM bookings
      WHERE booking_start_at >= NOW() - INTERVAL '1 day'
      ORDER BY booking_start_at ASC
      LIMIT 10
    `);

    console.log('API Query Results (last 24h):');
    apiQuery.rows.forEach((row, i) => {
      console.log(`\n${i+1}. ${row.invitee_name}`);
      console.log(`   booking_invitee_time: ${row.booking_invitee_time}`);
      console.log(`   booking_start_at: ${row.booking_start_at}`);
      console.log(`   Therapist: ${row.booking_host_name}`);
    });

    console.log('\n\n=== TIMEZONE SETTINGS ===');
    const tzCheck = await pool.query('SHOW timezone');
    console.log(`Database timezone: ${tzCheck.rows[0].TimeZone}`);
    
    const nowCheck = await pool.query('SELECT NOW(), CURRENT_TIMESTAMP');
    console.log(`Database NOW(): ${nowCheck.rows[0].now}`);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAppointmentsData();
