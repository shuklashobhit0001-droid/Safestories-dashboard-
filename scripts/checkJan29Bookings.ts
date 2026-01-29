import pool from '../lib/db';

async function checkJan29Bookings() {
  try {
    console.log('Checking all bookings for January 29, 2026...\n');

    // Query all bookings for Jan 29, 2026
    const query = `
      SELECT 
        b.booking_id,
        b.booking_resource_name as event_name,
        b.invitee_name,
        b.invitee_email,
        b.invitee_phone,
        b.booking_start_at,
        b.booking_end_at,
        b.booking_status,
        b.therapist_id,
        t.name as therapist_name,
        b.invitee_created_at,
        b.booking_updated_at
      FROM bookings b
      LEFT JOIN therapists t ON b.therapist_id::integer = t.id
      WHERE DATE(b.booking_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-01-29'
      ORDER BY b.booking_start_at;
    `;

    const result = await pool.query(query);
    
    console.log(`Total bookings found for Jan 29: ${result.rows.length}\n`);
    console.log('='.repeat(100));
    
    result.rows.forEach((booking, index) => {
      console.log(`\nBooking ${index + 1}:`);
      console.log(`  Booking ID: ${booking.booking_id}`);
      console.log(`  Event: ${booking.event_name}`);
      console.log(`  Client: ${booking.invitee_name}`);
      console.log(`  Email: ${booking.invitee_email}`);
      console.log(`  Phone: ${booking.invitee_phone}`);
      console.log(`  Start Time: ${booking.booking_start_at}`);
      console.log(`  End Time: ${booking.booking_end_at}`);
      console.log(`  Status: ${booking.booking_status}`);
      console.log(`  Therapist ID: ${booking.therapist_id}`);
      console.log(`  Therapist Name: ${booking.therapist_name}`);
      console.log(`  Created At: ${booking.invitee_created_at}`);
      console.log(`  Updated At: ${booking.booking_updated_at}`);
      console.log('-'.repeat(100));
    });

    // Group by status
    console.log('\n\nBookings grouped by status:');
    const statusGroups = result.rows.reduce((acc: any, booking) => {
      acc[booking.booking_status] = (acc[booking.booking_status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Group by therapist
    console.log('\n\nBookings grouped by therapist:');
    const therapistGroups = result.rows.reduce((acc: any, booking) => {
      const therapist = booking.therapist_name || 'Unassigned';
      acc[therapist] = (acc[therapist] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(therapistGroups).forEach(([therapist, count]) => {
      console.log(`  ${therapist}: ${count}`);
    });

    // Check current time and "in session" bookings
    console.log('\n\nCurrent time check:');
    const now = new Date();
    console.log(`  Current time (UTC): ${now.toISOString()}`);
    console.log(`  Current time (IST): ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    const inSessionQuery = `
      SELECT 
        b.booking_id,
        b.booking_resource_name as event_name,
        b.invitee_name,
        b.booking_start_at,
        b.booking_end_at,
        b.booking_status,
        t.name as therapist_name
      FROM bookings b
      LEFT JOIN therapists t ON b.therapist_id::integer = t.id
      WHERE DATE(b.booking_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-01-29'
        AND b.booking_start_at <= NOW()
        AND b.booking_end_at > NOW()
        AND b.booking_status = 'active';
    `;
    
    const inSessionResult = await pool.query(inSessionQuery);
    console.log(`\n  Bookings currently "in session" (active, started, not ended): ${inSessionResult.rows.length}`);
    
    if (inSessionResult.rows.length > 0) {
      inSessionResult.rows.forEach((booking, index) => {
        console.log(`\n  In-Session Booking ${index + 1}:`);
        console.log(`    Booking ID: ${booking.booking_id}`);
        console.log(`    Event: ${booking.event_name}`);
        console.log(`    Client: ${booking.invitee_name}`);
        console.log(`    Therapist: ${booking.therapist_name}`);
        console.log(`    Start: ${booking.booking_start_at}`);
        console.log(`    End: ${booking.booking_end_at}`);
        console.log(`    Status: ${booking.booking_status}`);
      });
    }

  } catch (error) {
    console.error('Error checking Jan 29 bookings:', error);
  } finally {
    await pool.end();
  }
}

checkJan29Bookings();
