import pool from '../lib/db';

async function testLiveCount() {
  try {
    console.log('🔍 Testing Live Count with booking_invitee_time...\n');
    console.log('Current Time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), 'IST\n');

    // Get all non-cancelled bookings with their times
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_host_name,
        booking_invitee_time,
        booking_start_at,
        booking_status
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
      ORDER BY booking_start_at
    `);

    let liveCount = 0;
    const liveSessions: any[] = [];
    const now = new Date();

    result.rows.forEach(row => {
      // Parse booking_invitee_time to extract end time
      // Format: "Monday, Jan 12, 2026 at 10:00 AM - 10:50 AM (GMT+05:30)"
      const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const startTime = new Date(row.booking_start_at);
        
        // Extract end time and create Date object
        const endTimeStr = timeMatch[2]; // e.g., "10:50 AM"
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        
        if (dateStr) {
          const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
          
          // Check if session is live
          if (now >= startTime && now <= endDateTime) {
            liveCount++;
            liveSessions.push({
              client: row.invitee_name,
              therapist: row.booking_host_name,
              time: row.booking_invitee_time,
              start: startTime,
              end: endDateTime
            });
          }
        }
      }
    });

    console.log(`🟢 Live Sessions Count: ${liveCount}\n`);
    
    if (liveSessions.length > 0) {
      console.log('📋 Live Sessions Details:');
      liveSessions.forEach((session, i) => {
        console.log(`\n${i + 1}. ${session.client} with ${session.therapist}`);
        console.log(`   Time: ${session.time}`);
        console.log(`   Start: ${session.start.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
        console.log(`   End: ${session.end.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
      });
    } else {
      console.log('No live sessions at the moment.');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLiveCount();
