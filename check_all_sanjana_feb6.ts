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

console.log('=== ALL SANJANA BOOKINGS ON FEB 6, 2026 ===\n');

async function checkAll() {
  try {
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
      WHERE b.invitee_name LIKE '%Sanjana%'
        AND b.invitee_email = 'sjoshi1597@gmail.com'
        AND DATE(b.booking_start_at) = '2026-02-06'
      ORDER BY b.booking_start_at
    `);

    console.log(`Found ${result.rows.length} booking(s) for Sanjana on Feb 6, 2026\n`);

    result.rows.forEach((booking, idx) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`BOOKING ${idx + 1}:`);
      console.log(`${'='.repeat(60)}`);
      console.log('Booking ID:', booking.booking_id);
      console.log('Time:', booking.booking_invitee_time);
      console.log('Session:', booking.booking_resource_name);
      console.log('Therapist:', booking.booking_host_name);
      console.log('Phone:', booking.invitee_phone);
      console.log('\nSTATUS INFO:');
      console.log('  booking_status (DB):', `"${booking.booking_status}"`);
      console.log('  has_session_notes:', booking.has_session_notes);
      console.log('  note_id:', booking.note_id || 'NULL');
      console.log('  is_past:', booking.is_past);
      
      // Determine what UI would show
      let uiStatus = booking.booking_status;
      
      if (booking.booking_status !== 'cancelled' && 
          booking.booking_status !== 'canceled' && 
          booking.booking_status !== 'no_show' && 
          booking.booking_status !== 'no show') {
        if (booking.has_session_notes) {
          uiStatus = 'completed';
        } else if (booking.is_past) {
          uiStatus = 'pending_notes';
        }
      }
      
      console.log('\nUI DISPLAY:');
      console.log('  Status shown:', uiStatus.toUpperCase());
      console.log('  Tab:', getTabName(uiStatus));
      console.log('  Badge:', getBadgeColor(uiStatus));
    });

    // Check if there's a time zone issue
    console.log('\n\n' + '='.repeat(60));
    console.log('TIME ZONE CHECK:');
    console.log('='.repeat(60));
    console.log('Current server time:', new Date().toISOString());
    console.log('Current IST time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    result.rows.forEach((booking, idx) => {
      const startTime = new Date(booking.booking_start_at);
      console.log(`\nBooking ${idx + 1} start time:`);
      console.log('  UTC:', startTime.toISOString());
      console.log('  IST:', startTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      console.log('  Is Past?', booking.is_past);
    });

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
    case 'no show': return 'No Show';
    case 'pending_notes': return 'Pending Notes';
    case 'scheduled': return 'Upcoming';
    default: return 'All Appointments';
  }
}

function getBadgeColor(status: string): string {
  switch(status) {
    case 'completed': return 'Green';
    case 'cancelled': return 'Red';
    case 'no_show': return 'Orange';
    case 'no show': return 'Orange';
    case 'pending_notes': return 'Yellow';
    default: return 'Blue';
  }
}

checkAll();
