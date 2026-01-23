import pool from '../lib/db';

async function checkAnjaliBooking() {
  try {
    console.log('Checking Anjali Ramaa booking...\n');
    
    // Search for the booking by phone or email
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_resource_name,
        booking_host_name,
        booking_invitee_time,
        booking_start_at,
        booking_mode,
        booking_status,
        invitee_created_at
      FROM bookings
      WHERE (invitee_phone LIKE '%9665556696%' OR invitee_email LIKE '%kalerp11@gmail.com%')
        OR (invitee_name ILIKE '%Anjali%' AND booking_host_name ILIKE '%Anjali Pillai%')
      ORDER BY booking_start_at DESC
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('No booking found for the specified criteria');
      console.log('Searching for recent bookings with Anjali Pillai as therapist...');
      
      const therapistResult = await pool.query(`
        SELECT 
          booking_id,
          invitee_name,
          invitee_phone,
          invitee_email,
          booking_resource_name,
          booking_host_name,
          booking_invitee_time,
          booking_start_at,
          booking_mode,
          booking_status
        FROM bookings
        WHERE booking_host_name ILIKE '%Anjali Pillai%'
        ORDER BY booking_start_at DESC
        LIMIT 10
      `);
      
      if (therapistResult.rows.length === 0) {
        console.log('No bookings found with Anjali Pillai as therapist');
        return;
      }
      
      console.log(`\nFound ${therapistResult.rows.length} recent bookings with Anjali Pillai:\n`);
      therapistResult.rows.forEach((b, i) => {
        console.log(`${i + 1}. ${b.invitee_name} - ${b.booking_invitee_time}`);
      });
      return;
    }

    console.log(`Found ${result.rows.length} booking(s) for Anjali Ramaa:\n`);
    
    result.rows.forEach((booking, index) => {
      console.log(`\n--- Booking ${index + 1} ---`);
      console.log('Booking ID:', booking.booking_id);
      console.log('Client Name:', booking.invitee_name);
      console.log('Phone:', booking.invitee_phone);
      console.log('Email:', booking.invitee_email);
      console.log('Session Name:', booking.booking_resource_name);
      console.log('Therapist:', booking.booking_host_name);
      console.log('Mode:', booking.booking_mode);
      console.log('Status:', booking.booking_status);
      console.log('\n--- TIMEZONE DATA ---');
      console.log('booking_invitee_time (displayed):', booking.booking_invitee_time);
      console.log('booking_start_at (stored in DB):', booking.booking_start_at);
      console.log('invitee_created_at:', booking.invitee_created_at);
      
      // Parse the timezone from booking_invitee_time
      const timezoneMatch = booking.booking_invitee_time?.match(/\(GMT([+-]\d+:\d+)\)/);
      if (timezoneMatch) {
        console.log('Detected Timezone Offset:', timezoneMatch[1]);
      }
      
      // Check if the stored timestamp is correct
      const storedDate = new Date(booking.booking_start_at);
      console.log('\nStored timestamp in UTC:', storedDate.toISOString());
      console.log('Stored timestamp in IST:', storedDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAnjaliBooking();
