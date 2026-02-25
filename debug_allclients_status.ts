import pool from './lib/db.ts';

async function debugAllClientsStatus() {
  try {
    console.log('\n🔍 DEBUGGING ALL CLIENTS STATUS ISSUE');
    console.log('='.repeat(80));

    // Check what /api/clients returns
    console.log('\n1. Checking /api/clients data structure:');
    console.log('-'.repeat(80));
    
    const clientsResult = await pool.query(`
      SELECT 
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_host_name,
        booking_resource_name,
        booking_mode,
        COUNT(*) as session_count,
        MAX(booking_start_at) as last_session_date
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled')
      GROUP BY invitee_email, invitee_phone, invitee_name, booking_host_name, booking_resource_name, booking_mode
      ORDER BY last_session_date DESC
      LIMIT 3
    `);

    console.log('\nSample clients from /api/clients:');
    clientsResult.rows.forEach((client, i) => {
      console.log(`\n${i + 1}. ${client.invitee_name}`);
      console.log(`   Email: ${client.invitee_email}`);
      console.log(`   Phone: ${client.invitee_phone}`);
      console.log(`   Last Session: ${new Date(client.last_session_date).toISOString().split('T')[0]}`);
    });

    // Check what /api/appointments returns
    console.log('\n\n2. Checking /api/appointments data structure:');
    console.log('-'.repeat(80));
    
    const appointmentsResult = await pool.query(`
      SELECT 
        invitee_email,
        invitee_phone,
        booking_start_at,
        booking_status
      FROM bookings
      ORDER BY booking_start_at DESC
      LIMIT 5
    `);

    console.log('\nSample appointments from /api/appointments:');
    appointmentsResult.rows.forEach((apt, i) => {
      console.log(`\n${i + 1}. ${apt.invitee_email || 'NO EMAIL'}`);
      console.log(`   Phone: ${apt.invitee_phone}`);
      console.log(`   Date: ${new Date(apt.booking_start_at).toISOString().split('T')[0]}`);
      console.log(`   Status: ${apt.booking_status}`);
    });

    // Test matching logic
    console.log('\n\n3. Testing matching logic for first client:');
    console.log('-'.repeat(80));
    
    const testClient = clientsResult.rows[0];
    console.log(`\nTest Client: ${testClient.invitee_name}`);
    console.log(`  Email: ${testClient.invitee_email}`);
    console.log(`  Phone: ${testClient.invitee_phone}`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const matchingAppointments = appointmentsResult.rows.filter(apt => {
      const clientEmail = testClient.invitee_email?.toLowerCase().trim();
      const aptEmail = apt.invitee_email?.toLowerCase().trim();
      const clientPhone = testClient.invitee_phone?.replace(/[\s\-\(\)\+]/g, '');
      const aptPhone = apt.invitee_phone?.replace(/[\s\-\(\)\+]/g, '');
      
      const emailMatch = clientEmail && aptEmail && clientEmail === aptEmail;
      const phoneMatch = clientPhone && aptPhone && clientPhone === aptPhone;
      const isNotCancelled = apt.booking_status !== 'cancelled' && apt.booking_status !== 'canceled';
      
      console.log(`\n  Checking appointment:`);
      console.log(`    Apt Email: ${apt.invitee_email}`);
      console.log(`    Apt Phone: ${apt.invitee_phone}`);
      console.log(`    Email Match: ${emailMatch}`);
      console.log(`    Phone Match: ${phoneMatch}`);
      console.log(`    Not Cancelled: ${isNotCancelled}`);
      console.log(`    Result: ${(emailMatch || phoneMatch) && isNotCancelled ? '✅ MATCH' : '❌ NO MATCH'}`);
      
      return (emailMatch || phoneMatch) && isNotCancelled;
    });

    console.log(`\n  Total matching appointments: ${matchingAppointments.length}`);

    const hasRecentAppointment = matchingAppointments.some(apt => {
      const aptDate = new Date(apt.booking_start_at);
      const isRecent = aptDate >= thirtyDaysAgo;
      console.log(`    ${aptDate.toISOString().split('T')[0]}: ${isRecent ? '✅ RECENT' : '❌ OLD'}`);
      return isRecent;
    });

    console.log(`\n  Has recent appointment: ${hasRecentAppointment ? '✅ YES' : '❌ NO'}`);

    let status = '';
    if (hasRecentAppointment) {
      status = '🟢 ACTIVE';
    } else if (matchingAppointments.length === 1) {
      status = '🔴 DROP-OUT';
    } else {
      status = '🟡 INACTIVE';
    }

    console.log(`  Calculated Status: ${status}`);

    console.log('\n\n4. Checking if /api/appointments endpoint exists:');
    console.log('-'.repeat(80));
    console.log('The issue might be that /api/appointments endpoint does not exist!');
    console.log('Let me check what endpoints are available...');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAllClientsStatus();
