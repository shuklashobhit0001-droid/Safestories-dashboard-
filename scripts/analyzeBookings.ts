import pool from '../lib/db';

async function analyzeBookings() {
  try {
    console.log('=== BOOKING ANALYSIS ===\n');

    // Current time
    const now = await pool.query('SELECT NOW() as current_time');
    console.log(`Current DB Time: ${now.rows[0].current_time}\n`);

    // Total bookings
    const total = await pool.query('SELECT COUNT(*) FROM bookings');
    console.log(`Total Bookings: ${total.rows[0].count}\n`);

    // Upcoming vs Past (based on booking_start_at)
    const timeBreakdown = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE booking_start_at > NOW()) as upcoming,
        COUNT(*) FILTER (WHERE booking_start_at <= NOW()) as past
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);
    
    console.log('=== TIME-BASED (Confirmed/Rescheduled Only) ===');
    console.log(`Upcoming: ${timeBreakdown.rows[0].upcoming}`);
    console.log(`Past: ${timeBreakdown.rows[0].past}\n`);

    // Status breakdown
    const statusBreakdown = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE booking_start_at > NOW()) as upcoming,
        COUNT(*) FILTER (WHERE booking_start_at <= NOW()) as past
      FROM bookings
      GROUP BY booking_status
      ORDER BY count DESC
    `);

    console.log('=== STATUS BREAKDOWN ===');
    statusBreakdown.rows.forEach(row => {
      console.log(`${row.booking_status}:`);
      console.log(`  Total: ${row.count}`);
      console.log(`  Upcoming: ${row.upcoming}`);
      console.log(`  Past: ${row.past}`);
    });

    // Check session notes
    const notesBreakdown = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE csn.note_id IS NOT NULL) as has_notes,
        COUNT(*) FILTER (WHERE csn.note_id IS NULL) as no_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE b.booking_start_at <= NOW()
      AND b.booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);

    console.log('\n=== SESSION NOTES (Past Sessions Only) ===');
    console.log(`Completed (has notes): ${notesBreakdown.rows[0].has_notes}`);
    console.log(`Pending Notes (no notes): ${notesBreakdown.rows[0].no_notes}`);

    // API simulation - what /api/appointments returns
    console.log('\n=== API SIMULATION (/api/appointments) ===');
    console.log('Query: booking_start_at >= NOW() - INTERVAL \'1 day\'\n');

    const apiResult = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.booking_start_at,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE b.booking_start_at >= NOW() - INTERVAL '1 day'
      ORDER BY b.booking_start_at ASC
    `);

    console.log(`Total appointments returned: ${apiResult.rows.length}\n`);

    // Count by computed status
    let scheduled = 0, completed = 0, pending_notes = 0, cancelled = 0, no_show = 0;

    apiResult.rows.forEach(row => {
      const sessionDate = new Date(row.booking_start_at);
      const currentDate = new Date();

      if (row.booking_status === 'cancelled' || row.booking_status === 'canceled') {
        cancelled++;
      } else if (row.booking_status === 'no_show' || row.booking_status === 'no show') {
        no_show++;
      } else if (row.has_session_notes) {
        completed++;
      } else if (sessionDate < currentDate) {
        pending_notes++;
      } else {
        scheduled++;
      }
    });

    console.log('API Status Counts:');
    console.log(`  Scheduled (upcoming): ${scheduled}`);
    console.log(`  Completed (has notes): ${completed}`);
    console.log(`  Pending Notes (past, no notes): ${pending_notes}`);
    console.log(`  Cancelled: ${cancelled}`);
    console.log(`  No Show: ${no_show}`);

    // Show upcoming appointments
    console.log('\n=== UPCOMING APPOINTMENTS (Next 10) ===');
    const upcoming = await pool.query(`
      SELECT 
        invitee_name,
        booking_invitee_time,
        booking_start_at,
        booking_host_name
      FROM bookings
      WHERE booking_start_at > NOW()
      AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
      ORDER BY booking_start_at ASC
      LIMIT 10
    `);

    upcoming.rows.forEach((row, i) => {
      console.log(`\n${i+1}. ${row.invitee_name} - ${row.booking_host_name}`);
      console.log(`   Expected: ${row.booking_invitee_time}`);
      console.log(`   DB Time: ${row.booking_start_at}`);
    });

    // Check for mismatches
    console.log('\n\n=== CHECKING FOR TIME MISMATCHES ===');
    const mismatchCheck = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        booking_invitee_time,
        booking_start_at
      FROM bookings
      WHERE booking_invitee_time IS NOT NULL
      LIMIT 5
    `);

    let mismatches = 0;
    mismatchCheck.rows.forEach(row => {
      // Extract time from booking_invitee_time
      const timeMatch = row.booking_invitee_time.match(/at (\d+):(\d+) ([AP]M)/);
      if (timeMatch) {
        let expectedHour = parseInt(timeMatch[1]);
        const expectedMin = parseInt(timeMatch[2]);
        const ampm = timeMatch[3];
        
        if (ampm === 'PM' && expectedHour !== 12) expectedHour += 12;
        if (ampm === 'AM' && expectedHour === 12) expectedHour = 0;

        const dbDate = new Date(row.booking_start_at);
        const dbHour = dbDate.getHours();
        const dbMin = dbDate.getMinutes();

        if (dbHour !== expectedHour || dbMin !== expectedMin) {
          console.log(`\n❌ MISMATCH: ${row.invitee_name}`);
          console.log(`   Expected: ${expectedHour}:${expectedMin}`);
          console.log(`   DB has: ${dbHour}:${dbMin}`);
          mismatches++;
        }
      }
    });

    if (mismatches === 0) {
      console.log('✅ No time mismatches found in sample!');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeBookings();
