import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

console.log('=== CHECKING SANJANA SESSION - Feb 6, 2026 ===\n');

async function checkSession() {
  try {
    // Search for the session - using the first one found
    const sessionResult = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_resource_name,
        booking_host_name,
        booking_status,
        booking_mode,
        booking_start_at,
        booking_invitee_time
      FROM bookings
      WHERE invitee_name LIKE '%Sanjana%'
        AND invitee_email = 'sjoshi1597@gmail.com'
        AND booking_start_at >= '2026-02-06 00:00:00'
        AND booking_start_at < '2026-02-07 00:00:00'
      ORDER BY booking_start_at
      LIMIT 1
    `);
    
    const session = sessionResult.rows[0];

    if (session) {
      console.log('📋 SESSION FOUND:');
      console.log('─────────────────────────────────────────');
      console.log('Booking ID:', session.booking_id);
      console.log('Date/Time:', session.booking_invitee_time);
      console.log('Client:', session.invitee_name);
      console.log('Email:', session.invitee_email);
      console.log('Phone:', session.invitee_phone);
      console.log('Therapy Type:', session.booking_resource_name);
      console.log('Therapist:', session.booking_host_name);
      console.log('Mode:', session.booking_mode);
      console.log('\n🔍 STATUS DETAILS:');
      console.log('─────────────────────────────────────────');
      console.log('Booking Status:', session.booking_status);
      
      // Check if session notes exist
      console.log('\n📝 SESSION NOTES CHECK:');
      console.log('─────────────────────────────────────────');
      
      const sessionNotesResult = await pool.query(`
        SELECT 
          note_id,
          booking_id,
          host_name,
          concerns_discussed,
          interventions_used,
          homework_suggested,
          next_session_plan,
          current_risk_level,
          created_at,
          updated_at
        FROM client_session_notes
        WHERE booking_id = $1
      `, [session.booking_id.toString()]);
      
      const sessionNotes = sessionNotesResult.rows[0];
  
      if (sessionNotes) {
        console.log('✓ Session notes EXIST');
        console.log('Note ID:', sessionNotes.note_id);
        console.log('Therapist:', sessionNotes.host_name);
        console.log('Created:', sessionNotes.created_at);
        console.log('Updated:', sessionNotes.updated_at);
        console.log('\nConcerns Discussed:', sessionNotes.concerns_discussed || 'N/A');
        console.log('Interventions:', sessionNotes.interventions_used || 'N/A');
        console.log('Homework:', sessionNotes.homework_suggested || 'N/A');
        console.log('Next Plan:', sessionNotes.next_session_plan || 'N/A');
        console.log('Risk Level:', sessionNotes.current_risk_level || 'N/A');
        console.log('Next Focus:', sessionNotes.next_session_focus || 'N/A');
        console.log('Risk Assessment:', sessionNotes.risk_assessment || 'N/A');
      } else {
        console.log('✗ No session notes found');
      }
      
      // Check additional notes
      console.log('\n📌 ADDITIONAL NOTES:');
      console.log('─────────────────────────────────────────');
      console.log('(Skipping additional notes check - table may not exist)');
      
      // Determine why status is "completed"
      console.log('\n🎯 STATUS DETERMINATION LOGIC:');
      console.log('─────────────────────────────────────────');
      
      const now = new Date();
      const sessionDateTime = new Date(session.booking_start_at);
      const isPast = sessionDateTime < now;
      
      console.log('Current time:', now.toISOString());
      console.log('Session start time:', sessionDateTime.toISOString());
      console.log('Session is in past:', isPast ? 'YES' : 'NO');
      
      console.log('\n📊 REASON FOR "COMPLETED" STATUS:');
      console.log('─────────────────────────────────────────');
      
      if (session.booking_status === 'completed') {
        console.log('✓ Database booking_status field is set to "completed"');
      } else if (session.booking_status === 'cancelled') {
        console.log('Status in DB is "cancelled" (not completed)');
      } else if (session.booking_status === 'no_show') {
        console.log('Status in DB is "no_show" (not completed)');
      } else if (sessionNotes) {
        console.log('✓ Session has session notes in client_session_notes table');
        console.log('  → Frontend logic marks sessions with notes as "completed"');
        console.log('\n💡 EXPLANATION:');
        console.log('The status shows as "completed" because:');
        console.log('1. Session notes exist (note_id: ' + sessionNotes.note_id + ')');
        console.log('2. The frontend checks for has_session_notes flag');
        console.log('3. When has_session_notes is true, status is displayed as "completed"');
        console.log('4. This happens regardless of the booking_status in database ("' + session.booking_status + '")');
      } else if (isPast && !sessionNotes) {
        console.log('⚠ Session is past but has no session notes');
        console.log('  → Frontend logic would mark this as "pending_notes"');
      } else {
        console.log('Session is upcoming (scheduled)');
      }
      
    } else {
      console.log('❌ SESSION NOT FOUND');
      console.log('\nSearching for similar sessions...\n');
      
      // Try to find by name only
      const similarSessionsResult = await pool.query(`
        SELECT 
          booking_id,
          booking_start_at,
          invitee_name,
          invitee_email,
          booking_host_name,
          booking_status
        FROM bookings
        WHERE invitee_name LIKE '%Sanjana%'
        ORDER BY booking_start_at DESC
        LIMIT 5
      `);
      
      const similarSessions = similarSessionsResult.rows;
      
      if (similarSessions.length > 0) {
        console.log('Found similar sessions:');
        similarSessions.forEach((s, idx) => {
          console.log(`\n${idx + 1}. ${s.invitee_name} - ${s.booking_start_at}`);
          console.log(`   Email: ${s.invitee_email}`);
          console.log(`   Therapist: ${s.booking_host_name}`);
          console.log(`   Status: ${s.booking_status}`);
        });
      } else {
        console.log('No sessions found for Sanjana');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSession();
