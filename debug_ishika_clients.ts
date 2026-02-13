import pool from './lib/db';

async function debugIshikaClients() {
  try {
    console.log('🔍 Debugging Ishika\'s clients status...\n');

    // Get Ishika's clients
    const clientsResult = await pool.query(`
      SELECT DISTINCT 
        invitee_name,
        invitee_email,
        invitee_phone
      FROM bookings
      WHERE booking_host_name ILIKE '%Ishika%'
      ORDER BY invitee_name
      LIMIT 5
    `);

    console.log(`📊 Found ${clientsResult.rows.length} clients\n`);

    // Get Ishika's appointments
    const appointmentsResult = await pool.query(`
      SELECT 
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_start_at,
        booking_status
      FROM bookings
      WHERE booking_host_name ILIKE '%Ishika%'
      ORDER BY booking_start_at DESC
    `);

    console.log(`📅 Found ${appointmentsResult.rows.length} appointments\n`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log(`📅 30 days ago: ${thirtyDaysAgo.toISOString().split('T')[0]}\n`);

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('TESTING MATCHING LOGIC');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    // Test each client
    for (const client of clientsResult.rows) {
      console.log(`\n🔍 Testing: ${client.invitee_name}`);
      console.log(`   Client Email: "${client.invitee_email}"`);
      console.log(`   Client Phone: "${client.invitee_phone}"`);
      
      // Find matching appointments
      const matchingAppointments = appointmentsResult.rows.filter(apt => {
        const clientEmail = client.invitee_email?.toLowerCase().trim();
        const aptEmail = apt.invitee_email?.toLowerCase().trim();
        const clientPhone = client.invitee_phone?.replace(/[\s\-\(\)\+]/g, '');
        const aptPhone = apt.invitee_phone?.replace(/[\s\-\(\)\+]/g, '');
        
        const emailMatch = clientEmail && aptEmail && clientEmail === aptEmail;
        const phoneMatch = clientPhone && aptPhone && clientPhone === aptPhone;
        
        return emailMatch || phoneMatch;
      });

      console.log(`   📋 Found ${matchingAppointments.length} matching appointments`);
      
      if (matchingAppointments.length > 0) {
        console.log(`   📅 Sample matches:`);
        matchingAppointments.slice(0, 3).forEach((apt, i) => {
          const aptDate = new Date(apt.booking_start_at);
          const isRecent = aptDate >= thirtyDaysAgo;
          const isNotCancelled = apt.booking_status !== 'cancelled' && apt.booking_status !== 'canceled';
          
          console.log(`      ${i + 1}. Date: ${apt.booking_start_at}`);
          console.log(`         Email: "${apt.invitee_email}"`);
          console.log(`         Phone: "${apt.invitee_phone}"`);
          console.log(`         Status: ${apt.booking_status || 'confirmed'}`);
          console.log(`         Recent? ${isRecent ? '✅' : '❌'} | Not Cancelled? ${isNotCancelled ? '✅' : '❌'}`);
        });
      }
      
      // Check if should be active
      const hasRecentAppointment = matchingAppointments.some(apt => {
        const aptDate = new Date(apt.booking_start_at);
        const isRecent = aptDate >= thirtyDaysAgo;
        const isNotCancelled = apt.booking_status !== 'cancelled' && apt.booking_status !== 'canceled';
        return isRecent && isNotCancelled;
      });
      
      console.log(`   🎯 Should be: ${hasRecentAppointment ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

debugIshikaClients();
