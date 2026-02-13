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

console.log('=== SANJANA STATUS MAPPING ANALYSIS ===\n');

async function checkStatusMapping() {
  try {
    // Get the exact booking
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.invitee_email,
        b.booking_resource_name,
        b.booking_host_name,
        b.booking_status as db_booking_status,
        b.booking_start_at,
        b.booking_invitee_time,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes,
        csn.note_id,
        (b.booking_start_at < NOW()) as is_past
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id::text = csn.booking_id
      WHERE b.invitee_name LIKE '%Sanjana%'
        AND b.invitee_email = 'sjoshi1597@gmail.com'
        AND b.booking_start_at >= '2026-02-06 00:00:00'
        AND b.booking_start_at < '2026-02-07 00:00:00'
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ Booking not found');
      return;
    }

    const booking = result.rows[0];

    console.log('📋 DATABASE VALUES:');
    console.log('═══════════════════════════════════════════');
    console.log('Booking ID:', booking.booking_id);
    console.log('Client:', booking.invitee_name);
    console.log('Session:', booking.booking_resource_name);
    console.log('Therapist:', booking.booking_host_name);
    console.log('Date/Time:', booking.booking_invitee_time);
    console.log('\n🔍 STATUS FIELDS:');
    console.log('─────────────────────────────────────────');
    console.log('booking_status (DB):', booking.db_booking_status);
    console.log('has_session_notes:', booking.has_session_notes);
    console.log('session_note_id:', booking.note_id || 'NULL');
    console.log('is_past:', booking.is_past);

    console.log('\n🔄 STATUS MAPPING LOGIC:');
    console.log('═══════════════════════════════════════════');
    
    // Simulate the backend logic (api/index.ts lines 454-461)
    let backendStatus = booking.db_booking_status;
    
    console.log('\n1️⃣ BACKEND PROCESSING (api/index.ts):');
    console.log('   Initial status from DB:', backendStatus);
    
    if (booking.db_booking_status !== 'cancelled' && 
        booking.db_booking_status !== 'canceled' && 
        booking.db_booking_status !== 'no_show' && 
        booking.db_booking_status !== 'no show') {
      
      console.log('   ✓ Status is NOT cancelled/no_show');
      
      if (booking.has_session_notes) {
        backendStatus = 'completed';
        console.log('   ✓ Has session notes → Status changed to: "completed"');
      } else if (booking.is_past) {
        backendStatus = 'pending_notes';
        console.log('   ✓ Session is past → Status changed to: "pending_notes"');
      } else {
        console.log('   → Status remains: "' + backendStatus + '"');
      }
    } else {
      console.log('   ✗ Status IS cancelled/no_show → Status preserved');
    }
    
    console.log('   Final backend status:', backendStatus);

    // Simulate the frontend logic (TherapistDashboard.tsx getAppointmentStatus)
    console.log('\n2️⃣ FRONTEND PROCESSING (getAppointmentStatus):');
    
    let frontendStatus = backendStatus;
    
    console.log('   Received status from backend:', frontendStatus);
    
    if (backendStatus === 'cancelled' || backendStatus === 'canceled') {
      frontendStatus = 'cancelled';
      console.log('   → Returns: "cancelled"');
    } else if (backendStatus === 'no_show' || backendStatus === 'no show') {
      frontendStatus = 'no_show';
      console.log('   → Returns: "no_show"');
    } else if (booking.has_session_notes) {
      frontendStatus = 'completed';
      console.log('   ✓ Has session notes → Returns: "completed"');
    } else if (booking.is_past) {
      frontendStatus = 'pending_notes';
      console.log('   ✓ Is past → Returns: "pending_notes"');
    } else {
      frontendStatus = 'scheduled';
      console.log('   → Returns: "scheduled"');
    }

    console.log('\n3️⃣ UI DISPLAY:');
    console.log('─────────────────────────────────────────');
    console.log('Status shown in UI:', frontendStatus.toUpperCase());
    
    const displayText = frontendStatus === 'pending_notes' ? 'Pending Notes' :
                       frontendStatus === 'no_show' ? 'No Show' :
                       frontendStatus === 'scheduled' ? 'Scheduled' :
                       frontendStatus.charAt(0).toUpperCase() + frontendStatus.slice(1);
    
    console.log('Display text:', displayText);
    
    const badgeColor = frontendStatus === 'completed' ? 'Green (bg-green-100)' :
                      frontendStatus === 'cancelled' ? 'Red (bg-red-100)' :
                      frontendStatus === 'no_show' ? 'Orange (bg-orange-100)' :
                      frontendStatus === 'pending_notes' ? 'Yellow (bg-yellow-100)' :
                      'Blue (bg-blue-100)';
    
    console.log('Badge color:', badgeColor);

    console.log('\n📊 COMPLETE FLOW SUMMARY:');
    console.log('═══════════════════════════════════════════');
    console.log('Database booking_status:', booking.db_booking_status);
    console.log('Has session notes:', booking.has_session_notes ? 'YES' : 'NO');
    console.log('Session note ID:', booking.note_id || 'NULL');
    console.log('↓');
    console.log('Backend transforms to:', backendStatus);
    console.log('↓');
    console.log('Frontend displays as:', displayText);
    console.log('↓');
    console.log('Tab where it appears:', getTabName(frontendStatus));

    console.log('\n💡 WHY "COMPLETED"?');
    console.log('═══════════════════════════════════════════');
    if (frontendStatus === 'completed') {
      console.log('✓ Session has session notes (note_id: ' + booking.note_id + ')');
      console.log('✓ Backend checks: has_session_notes = true');
      console.log('✓ Backend sets status to "completed"');
      console.log('✓ Frontend receives "completed" status');
      console.log('✓ UI displays: "Completed" with green badge');
      console.log('✓ Appears in: "Completed" tab');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

function getTabName(status: string): string {
  switch(status) {
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'no_show': return 'No Show';
    case 'pending_notes': return 'Pending Notes';
    case 'scheduled': return 'Upcoming';
    default: return 'All Appointments';
  }
}

checkStatusMapping();
