import pool from '../lib/db';

async function fixBookingTimestamps() {
  try {
    const bookings = await pool.query(`
      SELECT booking_id, booking_invitee_time, booking_start_at
      FROM bookings
      WHERE booking_invitee_time IS NOT NULL
    `);

    console.log(`Found ${bookings.rows.length} bookings to check\n`);
    let fixed = 0;

    for (const booking of bookings.rows) {
      const timeMatch = booking.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M)/i);
      if (!timeMatch) continue;

      const dateStr = timeMatch[1];
      const timeStr = timeMatch[2];
      const istTime = new Date(`${dateStr} ${timeStr} GMT+0530`);
      
      if (istTime.toISOString() !== booking.booking_start_at.toISOString()) {
        await pool.query(
          'UPDATE bookings SET booking_start_at = $1 WHERE booking_id = $2',
          [istTime, booking.booking_id]
        );
        console.log(`✓ Fixed ${booking.booking_id}: ${booking.booking_start_at.toISOString()} → ${istTime.toISOString()}`);
        fixed++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} bookings`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixBookingTimestamps();
