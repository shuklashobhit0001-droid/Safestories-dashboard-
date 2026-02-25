import pool from './lib/db';

async function debugLiveSessionsCount() {
  try {
    console.log('🔍 DEBUGGING LIVE SESSIONS COUNT');
    console.log('====================================================================================================\n');

    // Get current time
    const nowUTC = new Date();
    console.log(`⏰ Current Time (UTC): ${nowUTC.toISOString()}`);
    console.log(`⏰ Current Time (IST): ${nowUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}\n`);

    // Query all bookings that could be live
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_host_name,
        booking_resource_name,
        booking_invitee_time,
        booking_status,
        therapist_id,
        booking_start_at
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND therapist_id IS NOT NULL
        AND booking_resource_name NOT ILIKE '%free consultation%'
      ORDER BY booking_start_at
    `);

    console.log(`📊 Total bookings checked: ${result.rows.length}\n`);

    let liveCount = 0;
    const liveSessions: any[] = [];
    const upcomingSessions: any[] = [];
    const completedSessions: any[] = [];

    result.rows.forEach(row => {
      const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        const startTimeStr = timeMatch[1];
        const endTimeStr = timeMatch[2];
        
        if (dateStr) {
          // Parse timezone from booking_invitee_time
          const timezoneMatch = row.booking_invitee_time.match(/GMT([+-])(\d+):(\d+)/);
          let timezoneStr = 'GMT+0530'; // Default to IST
          
          if (timezoneMatch) {
            timezoneStr = `GMT${timezoneMatch[1]}${timezoneMatch[2]}${timezoneMatch[3]}`;
          }
          
          const startIST = new Date(`${dateStr} ${startTimeStr} ${timezoneStr}`);
          const endIST = new Date(`${dateStr} ${endTimeStr} ${timezoneStr}`);
          
          const sessionInfo = {
            booking_id: row.booking_id,
            client: row.invitee_name,
            therapist: row.booking_host_name,
            session_type: row.booking_resource_name,
            time_string: row.booking_invitee_time,
            start_time: startIST,
            end_time: endIST,
            status: row.booking_status,
            is_live: nowUTC >= startIST && nowUTC <= endIST
          };
          
          if (nowUTC >= startIST && nowUTC <= endIST) {
            liveCount++;
            liveSessions.push(sessionInfo);
          } else if (nowUTC < startIST) {
            upcomingSessions.push(sessionInfo);
          } else {
            completedSessions.push(sessionInfo);
          }
        }
      }
    });

    console.log('🔴 LIVE SESSIONS:', liveCount);
    console.log('====================================================================================================');
    liveSessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ${session.client}`);
      console.log(`   Therapist: ${session.therapist}`);
      console.log(`   Session Type: ${session.session_type}`);
      console.log(`   Time: ${session.time_string}`);
      console.log(`   Start (UTC): ${session.start_time.toISOString()}`);
      console.log(`   End (UTC): ${session.end_time.toISOString()}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Booking ID: ${session.booking_id}`);
    });

    console.log('\n\n⏰ UPCOMING SESSIONS (Next 5):');
    console.log('====================================================================================================');
    upcomingSessions.slice(0, 5).forEach((session, index) => {
      const minutesUntil = Math.floor((session.start_time.getTime() - nowUTC.getTime()) / 60000);
      console.log(`\n${index + 1}. ${session.client}`);
      console.log(`   Therapist: ${session.therapist}`);
      console.log(`   Time: ${session.time_string}`);
      console.log(`   ⏱️  Starts in: ${minutesUntil} minutes`);
    });

    console.log('\n\n✅ RECENTLY COMPLETED SESSIONS (Last 5):');
    console.log('====================================================================================================');
    completedSessions.slice(-5).reverse().forEach((session, index) => {
      const minutesAgo = Math.floor((nowUTC.getTime() - session.end_time.getTime()) / 60000);
      console.log(`\n${index + 1}. ${session.client}`);
      console.log(`   Therapist: ${session.therapist}`);
      console.log(`   Time: ${session.time_string}`);
      console.log(`   ⏱️  Ended: ${minutesAgo} minutes ago`);
    });

    console.log('\n\n📈 SUMMARY');
    console.log('====================================================================================================');
    console.log(`🔴 Live Sessions: ${liveCount}`);
    console.log(`⏰ Upcoming Sessions: ${upcomingSessions.length}`);
    console.log(`✅ Completed Sessions: ${completedSessions.length}`);
    console.log(`📊 Total Checked: ${result.rows.length}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

debugLiveSessionsCount();
