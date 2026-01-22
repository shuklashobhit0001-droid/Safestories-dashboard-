import pool from '../lib/db';

async function checkLiveStatus() {
  try {
    const now = new Date();
    console.log('Current time (UTC):', now.toISOString());
    console.log('Current time (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    // Check Ishika's booking
    const booking = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_host_name,
        booking_invitee_time,
        booking_start_at,
        booking_status
      FROM bookings
      WHERE booking_host_name ILIKE '%Ishika%'
        AND booking_status NOT IN ('cancelled', 'canceled', 'no_show')
      ORDER BY booking_start_at ASC
      LIMIT 1
    `);
    
    if (booking.rows.length > 0) {
      const b = booking.rows[0];
      console.log('\nNext Ishika booking:');
      console.log('Client:', b.invitee_name);
      console.log('Time:', b.booking_invitee_time);
      console.log('Start:', b.booking_start_at);
      
      const timeMatch = b.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M)/i);
      if (timeMatch) {
        const dateStr = timeMatch[1];
        const timeStr = timeMatch[2];
        const startTime = new Date(`${dateStr} ${timeStr} GMT+0530`);
        const endTime = new Date(startTime.getTime() + 50 * 60 * 1000);
        
        console.log('\nParsed times:');
        console.log('Start:', startTime.toISOString());
        console.log('End:', endTime.toISOString());
        console.log('Now:', now.toISOString());
        console.log('\nIs Live?', now >= startTime && now <= endTime);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLiveStatus();
