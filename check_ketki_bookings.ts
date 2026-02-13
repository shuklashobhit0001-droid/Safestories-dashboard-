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

console.log('=== CHECKING KETKI BOOKINGS ===\n');

async function checkKetki() {
  try {
    // Find all Ketki bookings
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.invitee_email,
        b.invitee_phone,
        b.booking_resource_name,
        b.booking_host_name,
        b.booking_status,
        b.booking_start_at,
        b.booking_invitee_time,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes,
        csn.note_id,
        (b.booking_start_at < NOW()) as is_past
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id::text = csn.booking_id
      WHERE b.invitee_name ILIKE '%Ketki%'
      ORDER BY b.booking_start_at DESC
    `);

    console.log(`Found ${result.rows.length} booking(s) for Ketki\n`);

    if (result.rows.length === 0) {
      console.log('No bookings found for Ketki');
      return;
    }

    // Group by status
    const byStatus: { [key: string]: any[] } = {
      'no_show': [],
      'cancelled': [],
      'confirmed': [],
      'completed': [],
      'other': []
    };

    result.rows.forEach(booking => {
      const status = booking.booking_status?.toLowerCase() || 'unknown';
      
      if (status === 'no_show' || status === 'no show') {
        byStatus['no_show'].push(booking);
      } else if (status === 'cancelled' || status === 'canceled') {
        byStatus['cancelled'].push(booking);
      } else if (status === 'confirmed') {
        byStatus['confirmed'].push(booking);
      } else if (status === 'completed') {
        byStatus['completed'].push(booking);
      } else {
        byStatus['other'].push(booking);
      }
    });

    // Display results
    console.log('📊 BOOKINGS BY DATABASE STATUS:');
    console.log('═══════════════════════════════════════════\n');

    // No Show bookings
    if (byStatus['no_show'].length > 0) {
      console.log(`🔴 NO SHOW (${byStatus['no_show'].length} booking(s)):`);
      console.log('─────────────────────────────────────────');
      byStatus['no_show'].forEach((b, idx) => {
        console.log(`\n${idx + 1}. Booking ID: ${b.booking_id}`);
        console.log(`   Date: ${b.booking_invitee_time}`);
        console.log(`   Therapy: ${b.booking_resource_name}`);
        console.log(`   Therapist: ${b.booking_host_name}`);
        console.log(`   DB Status: ${b.booking_status}`);
        console.log(`   Has Session Notes: ${b.has_session_notes ? 'YES ✓' : 'NO ✗'}`);
        if (b.has_session_notes) {
          console.log(`   Session Note ID: ${b.note_id}`);
        }
        console.log(`   Is Past: ${b.is_past ? 'YES' : 'NO'}`);
        
        // Determine what frontend would show
        let frontendStatus = 'unknown';
        if (b.booking_status === 'no_show' || b.booking_status === 'no show') {
          frontendStatus = 'no_show';
        } else if (b.has_session_notes) {
          frontendStatus = 'completed';
        } else if (b.is_past) {
          frontendStatus = 'pending_notes';
        } else {
          frontendStatus = 'scheduled';
        }
        console.log(`   Frontend Display: ${frontendStatus.toUpperCase()}`);
        console.log(`   Should appear in: "${frontendStatus === 'no_show' ? 'No Show' : frontendStatus}" tab`);
      });
      console.log('\n');
    }

    // Cancelled bookings
    if (byStatus['cancelled'].length > 0) {
      console.log(`🚫 CANCELLED (${byStatus['cancelled'].length} booking(s)):`);
      console.log('─────────────────────────────────────────');
      byStatus['cancelled'].forEach((b, idx) => {
        console.log(`${idx + 1}. ${b.booking_invitee_time} - ${b.booking_resource_name}`);
        console.log(`   Status: ${b.booking_status}, Has Notes: ${b.has_session_notes ? 'YES' : 'NO'}`);
      });
      console.log('\n');
    }

    // Confirmed bookings
    if (byStatus['confirmed'].length > 0) {
      console.log(`✅ CONFIRMED (${byStatus['confirmed'].length} booking(s)):`);
      console.log('─────────────────────────────────────────');
      byStatus['confirmed'].forEach((b, idx) => {
        console.log(`${idx + 1}. ${b.booking_invitee_time} - ${b.booking_resource_name}`);
        console.log(`   Status: ${b.booking_status}, Has Notes: ${b.has_session_notes ? 'YES' : 'NO'}, Past: ${b.is_past ? 'YES' : 'NO'}`);
        
        // Determine frontend display
        let frontendStatus = 'scheduled';
        if (b.has_session_notes) {
          frontendStatus = 'completed';
        } else if (b.is_past) {
          frontendStatus = 'pending_notes';
        }
        console.log(`   Frontend Display: ${frontendStatus.toUpperCase()}`);
      });
      console.log('\n');
    }

    // Completed bookings
    if (byStatus['completed'].length > 0) {
      console.log(`✔️ COMPLETED (${byStatus['completed'].length} booking(s)):`);
      console.log('─────────────────────────────────────────');
      byStatus['completed'].forEach((b, idx) => {
        console.log(`${idx + 1}. ${b.booking_invitee_time} - ${b.booking_resource_name}`);
        console.log(`   Status: ${b.booking_status}, Has Notes: ${b.has_session_notes ? 'YES' : 'NO'}`);
      });
      console.log('\n');
    }

    // Other statuses
    if (byStatus['other'].length > 0) {
      console.log(`❓ OTHER STATUS (${byStatus['other'].length} booking(s)):`);
      console.log('─────────────────────────────────────────');
      byStatus['other'].forEach((b, idx) => {
        console.log(`${idx + 1}. ${b.booking_invitee_time} - ${b.booking_resource_name}`);
        console.log(`   Status: ${b.booking_status}, Has Notes: ${b.has_session_notes ? 'YES' : 'NO'}`);
      });
      console.log('\n');
    }

    // Summary
    console.log('📋 SUMMARY:');
    console.log('═══════════════════════════════════════════');
    console.log(`Total Bookings: ${result.rows.length}`);
    console.log(`No Show: ${byStatus['no_show'].length}`);
    console.log(`Cancelled: ${byStatus['cancelled'].length}`);
    console.log(`Confirmed: ${byStatus['confirmed'].length}`);
    console.log(`Completed: ${byStatus['completed'].length}`);
    console.log(`Other: ${byStatus['other'].length}`);
    
    // Check for potential issues
    console.log('\n⚠️  POTENTIAL ISSUES:');
    console.log('═══════════════════════════════════════════');
    
    const noShowWithNotes = byStatus['no_show'].filter(b => b.has_session_notes);
    if (noShowWithNotes.length > 0) {
      console.log(`\n🔍 Found ${noShowWithNotes.length} NO_SHOW booking(s) that have session notes:`);
      noShowWithNotes.forEach(b => {
        console.log(`   - Booking ${b.booking_id}: ${b.booking_invitee_time}`);
        console.log(`     This will show as "No Show" (correct behavior)`);
        console.log(`     Even though it has session notes, no_show status takes priority`);
      });
    } else {
      console.log('✓ No no_show bookings with session notes found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkKetki();
