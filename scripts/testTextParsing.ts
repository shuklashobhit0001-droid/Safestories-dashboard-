import pool from '../lib/db';

async function testTextParsing() {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.booking_invitee_time,
        b.booking_start_at,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE b.booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
      ORDER BY b.booking_start_at DESC
      LIMIT 10
    `);

    console.log('=== TESTING TEXT PARSING LOGIC ===\n');
    console.log(`Current browser time: ${new Date()}\n`);

    result.rows.forEach(row => {
      console.log(`\n${row.invitee_name}:`);
      console.log(`  booking_invitee_time: ${row.booking_invitee_time}`);
      console.log(`  booking_start_at: ${row.booking_start_at}`);
      console.log(`  has_session_notes: ${row.has_session_notes}`);
      
      // Test the parsing logic
      if (row.booking_invitee_time) {
        const timeMatch = row.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M)/);
        
        if (timeMatch) {
          const [, dateStr, startTimeStr, endTimeStr] = timeMatch;
          console.log(`  Parsed date: ${dateStr}`);
          console.log(`  Parsed end time: ${endTimeStr}`);
          
          const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
          console.log(`  Created Date object: ${endDateTime}`);
          console.log(`  Is valid: ${!isNaN(endDateTime.getTime())}`);
          console.log(`  Is past: ${endDateTime < new Date()}`);
          
          // Calculate status
          let status = 'scheduled';
          if (row.has_session_notes) {
            status = 'completed';
          } else if (endDateTime < new Date()) {
            status = 'pending_notes';
          }
          console.log(`  Calculated status: ${status}`);
        } else {
          console.log(`  ❌ Failed to parse time string`);
        }
      }
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testTextParsing();
