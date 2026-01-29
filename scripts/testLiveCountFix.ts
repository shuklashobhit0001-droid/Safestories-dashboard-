import pool from '../lib/db';

async function testLiveCountFix() {
  try {
    console.log('TESTING LIVE COUNT FIX\n');
    console.log('='.repeat(100));
    
    const result = await pool.query(`
      SELECT booking_invitee_time, booking_resource_name, therapist_id, invitee_name
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show')
        AND therapist_id IS NOT NULL
        AND booking_resource_name NOT ILIKE '%free consultation%'
    `);

    console.log(`\nTotal bookings (excluding free consultations): ${result.rows.length}\n`);
    
    let liveCount = 0;
    const nowUTC = new Date();
    console.log(`Current time (UTC): ${nowUTC.toISOString()}`);
    console.log(`Current time (IST): ${nowUTC.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`);
    
    result.rows.forEach((row, index) => {
      const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
      
      if (timeMatch) {
        const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
        const startTimeStr = timeMatch[1];
        const endTimeStr = timeMatch[2];
        
        if (dateStr) {
          const startIST = new Date(`${dateStr} ${startTimeStr} GMT+0530`);
          const endIST = new Date(`${dateStr} ${endTimeStr} GMT+0530`);
          
          const isLive = nowUTC >= startIST && nowUTC <= endIST;
          
          if (isLive) {
            liveCount++;
            console.log(`✓ LIVE SESSION ${liveCount}:`);
            console.log(`  Client: ${row.invitee_name}`);
            console.log(`  Session: ${row.booking_resource_name}`);
            console.log(`  Therapist ID: ${row.therapist_id}`);
            console.log(`  Time: ${row.booking_invitee_time}\n`);
          }
        }
      }
    });
    
    console.log('='.repeat(100));
    console.log(`\nFINAL LIVE COUNT (excluding free consultations): ${liveCount}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testLiveCountFix();
