import pool from './lib/db';

async function checkClientActiveStatus() {
  try {
    console.log('🔍 Checking client active status based on last 30 days...\n');

    // Get all clients with their therapists
    const clientsResult = await pool.query(`
      SELECT DISTINCT
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_host_name as therapist_name
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled')
      ORDER BY invitee_name
    `);

    console.log(`📊 Total unique clients found: ${clientsResult.rows.length}\n`);

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log(`📅 Checking for sessions after: ${thirtyDaysAgo.toISOString().split('T')[0]}\n`);

    // Check each client
    const results = [];
    
    for (const client of clientsResult.rows) {
      // Get appointments for this client in last 30 days
      const appointmentsResult = await pool.query(`
        SELECT 
          booking_start_at,
          booking_resource_name,
          booking_status,
          booking_host_name
        FROM bookings
        WHERE (invitee_email = $1 OR invitee_phone = $2)
          AND booking_start_at >= $3
          AND booking_status NOT IN ('cancelled', 'canceled')
        ORDER BY booking_start_at DESC
      `, [client.invitee_email, client.invitee_phone, thirtyDaysAgo]);

      const hasRecentSession = appointmentsResult.rows.length > 0;
      const status = hasRecentSession ? 'ACTIVE' : 'INACTIVE';

      results.push({
        name: client.invitee_name,
        email: client.invitee_email,
        phone: client.invitee_phone,
        therapist: client.therapist_name,
        status: status,
        recentSessions: appointmentsResult.rows.length,
        lastSession: appointmentsResult.rows[0]?.booking_start_at || 'None'
      });
    }

    // Sort by status (Active first) then by name
    results.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'ACTIVE' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Display results
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('CLIENT ACTIVE STATUS REPORT');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    const activeClients = results.filter(r => r.status === 'ACTIVE');
    const inactiveClients = results.filter(r => r.status === 'INACTIVE');

    console.log(`✅ ACTIVE CLIENTS (${activeClients.length}):`);
    console.log('─────────────────────────────────────────────────────────────────────────────\n');
    
    activeClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Phone: ${client.phone}`);
      console.log(`   Therapist: ${client.therapist}`);
      console.log(`   Recent Sessions (last 30 days): ${client.recentSessions}`);
      console.log(`   Last Session: ${client.lastSession}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(`❌ INACTIVE CLIENTS (${inactiveClients.length}):`);
    console.log('─────────────────────────────────────────────────────────────────────────────\n');
    
    inactiveClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Phone: ${client.phone}`);
      console.log(`   Therapist: ${client.therapist}`);
      console.log(`   Recent Sessions (last 30 days): 0`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(`Total Clients: ${results.length}`);
    console.log(`Active (had session in last 30 days): ${activeClients.length} (${((activeClients.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`Inactive (no session in last 30 days): ${inactiveClients.length} (${((inactiveClients.length / results.length) * 100).toFixed(1)}%)`);
    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkClientActiveStatus();
