import pool from '../lib/db';

async function countAllStatuses() {
  try {
    console.log('=== APPOINTMENT STATUS COUNTS ===\n');

    const now = new Date();
    console.log(`Current Time: ${now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST\n`);

    // Get all appointments
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
      ORDER BY b.booking_start_at DESC
    `);

    let scheduled = 0;
    let completed = 0;
    let pending_notes = 0;
    let cancelled = 0;
    let no_show = 0;

    const scheduledList = [];
    const completedList = [];
    const pendingNotesList = [];
    const cancelledList = [];
    const noShowList = [];

    result.rows.forEach(row => {
      // Parse end time from booking_invitee_time
      let status = 'scheduled';
      
      if (row.booking_status === 'cancelled' || row.booking_status === 'canceled') {
        status = 'cancelled';
        cancelled++;
        cancelledList.push(row.invitee_name);
      } else if (row.booking_status === 'no_show' || row.booking_status === 'no show') {
        status = 'no_show';
        no_show++;
        noShowList.push(row.invitee_name);
      } else if (row.has_session_notes) {
        status = 'completed';
        completed++;
        completedList.push(row.invitee_name);
      } else if (row.booking_invitee_time) {
        const timeMatch = row.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M)/);
        if (timeMatch) {
          const [, dateStr, , endTimeStr] = timeMatch;
          const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
          if (endDateTime < now) {
            status = 'pending_notes';
            pending_notes++;
            pendingNotesList.push(row.invitee_name);
          } else {
            scheduled++;
            scheduledList.push(row.invitee_name);
          }
        }
      }
    });

    console.log('=== COUNTS ===');
    console.log(`Total: ${result.rows.length}`);
    console.log(`Scheduled (Upcoming): ${scheduled}`);
    console.log(`Completed: ${completed}`);
    console.log(`Pending Notes: ${pending_notes}`);
    console.log(`Cancelled: ${cancelled}`);
    console.log(`No Show: ${no_show}`);

    console.log('\n=== SCHEDULED (UPCOMING) ===');
    scheduledList.forEach((name, i) => console.log(`${i+1}. ${name}`));

    console.log('\n=== COMPLETED ===');
    completedList.forEach((name, i) => console.log(`${i+1}. ${name}`));

    console.log('\n=== PENDING NOTES ===');
    pendingNotesList.forEach((name, i) => console.log(`${i+1}. ${name}`));

    console.log('\n=== CANCELLED ===');
    cancelledList.forEach((name, i) => console.log(`${i+1}. ${name}`));

    console.log('\n=== NO SHOW ===');
    noShowList.forEach((name, i) => console.log(`${i+1}. ${name}`));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countAllStatuses();
