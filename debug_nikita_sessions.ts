import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugNikitaSessions() {
  try {
    console.log('Fetching all sessions for Nikita Jain...\n');
    
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_resource_name,
        b.booking_start_at,
        b.booking_invitee_time,
        b.booking_status,
        CASE WHEN (csn.note_id IS NOT NULL OR cpn.id IS NOT NULL OR fcn.id IS NOT NULL) THEN true ELSE false END as has_session_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      LEFT JOIN client_progress_notes cpn ON b.booking_id = cpn.booking_id
      LEFT JOIN free_consultation_pretherapy_notes fcn ON b.booking_id = fcn.booking_id
      WHERE (b.invitee_email = 'canikitajain14@gmail.com' OR b.invitee_phone = '+91 9167372938')
      ORDER BY b.booking_start_at DESC
    `);

    console.log(`Found ${result.rows.length} sessions:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.booking_resource_name}`);
      console.log(`   Date: ${row.booking_invitee_time}`);
      console.log(`   Start: ${row.booking_start_at}`);
      console.log(`   Status: ${row.booking_status}`);
      console.log(`   Has Notes: ${row.has_session_notes}`);
      
      // Calculate what the frontend status would be
      let frontendStatus = row.booking_status || 'confirmed';
      
      if (frontendStatus === 'cancelled' || frontendStatus === 'canceled') {
        frontendStatus = 'cancelled';
      } else if (frontendStatus === 'no_show' || frontendStatus === 'no show') {
        frontendStatus = 'no_show';
      } else if (row.has_session_notes) {
        frontendStatus = 'completed';
      } else {
        // Check if session ended
        if (row.booking_invitee_time) {
          const timeMatch = row.booking_invitee_time.match(/(\w+, \w+ \d+, \d+) at (\d+:\d+ [AP]M) - (\d+:\d+ [AP]M)/);
          if (timeMatch) {
            const [, dateStr, , endTimeStr] = timeMatch;
            const endDateTime = new Date(`${dateStr} ${endTimeStr}`);
            
            if (!isNaN(endDateTime.getTime())) {
              const now = new Date();
              if (endDateTime < now && !row.has_session_notes) {
                frontendStatus = 'pending_notes';
              } else {
                frontendStatus = 'scheduled';
              }
            }
          }
        }
      }
      
      console.log(`   Frontend Status: ${frontendStatus}`);
      console.log(`   Should show in Last Session: ${frontendStatus === 'completed' || frontendStatus === 'pending_notes' ? 'YES' : 'NO'}`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

debugNikitaSessions();
