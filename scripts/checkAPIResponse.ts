import pool from '../lib/db';

async function checkAPIResponse() {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.booking_invitee_time,
        b.booking_start_at,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes,
        NOW() as current_time,
        b.booking_start_at < NOW() as is_past
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      WHERE b.booking_start_at >= NOW() - INTERVAL '7 days'
      AND b.invitee_name IN ('Muskan', 'Samara Grewal', 'Simone Pinto', 'Nikita Jain')
      ORDER BY b.booking_start_at DESC
    `);

    console.log('=== API RESPONSE CHECK ===\n');
    console.log(`Current time: ${result.rows[0]?.current_time}\n`);
    
    result.rows.forEach(row => {
      console.log(`${row.invitee_name}:`);
      console.log(`  booking_status: ${row.booking_status}`);
      console.log(`  has_session_notes: ${row.has_session_notes}`);
      console.log(`  is_past: ${row.is_past}`);
      console.log(`  booking_start_at: ${row.booking_start_at}`);
      
      // Calculate what status the API SHOULD return
      let calculatedStatus = row.booking_status;
      if (row.booking_status !== 'cancelled' && row.booking_status !== 'canceled' && 
          row.booking_status !== 'no_show' && row.booking_status !== 'no show') {
        if (row.has_session_notes) {
          calculatedStatus = 'completed';
        } else if (row.is_past) {
          calculatedStatus = 'pending_notes';
        }
      }
      console.log(`  Calculated status: ${calculatedStatus}`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAPIResponse();
