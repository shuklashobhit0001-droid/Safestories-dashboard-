import pool from '../lib/db';

async function checkLiveCountLogic() {
  try {
    console.log('CHECKING LIVE COUNT API LOGIC\n');
    console.log('='.repeat(100));
    
    // Get all non-cancelled bookings for today
    const query = `
      SELECT 
        booking_id,
        invitee_name,
        booking_invitee_time,
        booking_start_at,
        booking_end_at,
        booking_status
      FROM bookings
      WHERE DATE(booking_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-01-29'
      ORDER BY booking_start_at;
    `;
    
    const result = await pool.query(query);
    
    console.log(`\nTotal bookings for Jan 29: ${result.rows.length}\n`);
    
    let liveCount = 0;
    const nowUTC = new Date();
    console.log(`Current time (UTC): ${nowUTC.toISOString()}`);
    console.log(`Current time (IST): ${nowUTC.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`\nBooking ${index + 1}: ${row.booking_id} - ${row.invitee_name}`);
      console.log(`  Status: ${row.booking_status}`);
      console.log(`  booking_invitee_time: "${row.booking_invitee_time}"`);
      console.log(`  booking_start_at: ${row.booking_start_at}`);
      console.log(`  booking_end_at: ${row.booking_end_at}`);
      
      // Simulate the API logic
      const timeMatch = row.booking_invitee_time?.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        const startTimeStr = timeMatch[1];
        const endTimeStr = timeMatch[2];
        
        console.log(`  Parsed date: "${dateStr}"`);
        console.log(`  Parsed start time: "${startTimeStr}"`);
        console.log(`  Parsed end time: "${endTimeStr}"`);
        
        if (dateStr) {
          const startIST = new Date(`${dateStr} ${startTimeStr} GMT+0530`);
          const endIST = new Date(`${dateStr} ${endTimeStr} GMT+0530`);
          
          console.log(`  Calculated start (UTC): ${startIST.toISOString()}`);
          console.log(`  Calculated end (UTC): ${endIST.toISOString()}`);
          
          const isLive = nowUTC >= startIST && nowUTC <= endIST;
          console.log(`  Is Live? ${isLive}`);
          
          if (isLive) {
            liveCount++;
            console.log(`  ✓ COUNTED AS LIVE`);
          }
        }
      } else {
        console.log(`  ✗ Could not parse time from booking_invitee_time`);
      }
    });
    
    console.log('\n' + '='.repeat(100));
    console.log(`\nFINAL LIVE COUNT: ${liveCount}`);
    console.log('\nNote: The API counts ALL non-cancelled bookings that are currently in session,');
    console.log('regardless of booking_status being "active" or "confirmed".\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkLiveCountLogic();
