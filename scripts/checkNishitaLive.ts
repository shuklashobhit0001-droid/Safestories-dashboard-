import pool from '../lib/db';

async function checkNishitaLive() {
  try {
    const now = new Date();
    console.log('Current time (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    const booking = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_host_name,
        booking_invitee_time,
        booking_status
      FROM bookings
      WHERE invitee_name ILIKE '%Nishita%'
    `);
    
    if (booking.rows.length > 0) {
      const b = booking.rows[0];
      console.log('\nNishita booking:');
      console.log('Therapist:', b.booking_host_name);
      console.log('Time:', b.booking_invitee_time);
      console.log('Status:', b.booking_status);
      
      const timeMatch = b.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M)/i);
      if (timeMatch) {
        const dateStr = timeMatch[1];
        const timeStr = timeMatch[2];
        const startTime = new Date(`${dateStr} ${timeStr} GMT+0530`);
        const endTime = new Date(startTime.getTime() + 50 * 60 * 1000);
        
        console.log('\nStart:', startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
        console.log('End:', endTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
        console.log('Is Live?', now >= startTime && now <= endTime);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkNishitaLive();
