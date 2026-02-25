import pool from './lib/db';

async function analyzeClientStatus() {
  try {
    // Get all bookings
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_start_at,
        booking_status,
        booking_host_name
      FROM bookings
      WHERE booking_status NOT IN ('cancelled', 'canceled')
      ORDER BY invitee_phone, booking_start_at DESC
    `);

    // Group by client (using phone as key)
    const clientMap = new Map();
    
    result.rows.forEach(row => {
      const phone = row.invitee_phone?.replace(/[\s\-\(\)\+]/g, '');
      if (!phone) return;
      
      if (!clientMap.has(phone)) {
        clientMap.set(phone, {
          name: row.invitee_name,
          email: row.invitee_email,
          phone: row.invitee_phone,
          therapist: row.booking_host_name,
          sessions: []
        });
      }
      
      clientMap.get(phone).sessions.push({
        date: new Date(row.booking_start_at),
        status: row.booking_status
      });
    });

    // Calculate status for each client
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeClients: any[] = [];
    const inactiveClients: any[] = [];
    const dropoutClients: any[] = [];
    
    clientMap.forEach((client, phone) => {
      const sessions = client.sessions;
      const totalSessions = sessions.length;
      
      if (totalSessions === 0) return;
      
      // Get most recent session
      const lastSession = sessions[0];
      const lastSessionDate = lastSession.date;
      const daysSinceLastSession = Math.floor((new Date().getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if has recent session (last 30 days)
      const hasRecentSession = sessions.some(s => s.date >= thirtyDaysAgo);
      
      let status = '';
      let reason = '';
      
      if (hasRecentSession) {
        status = 'ACTIVE';
        reason = `Has session in last 30 days`;
      } else if (totalSessions === 1) {
        status = 'DROP-OUT';
        reason = `Only 1 session, ${daysSinceLastSession} days ago`;
      } else {
        status = 'INACTIVE';
        reason = `${totalSessions} sessions, last one ${daysSinceLastSession} days ago`;
      }
      
      const clientInfo = {
        name: client.name,
        phone: client.phone,
        therapist: client.therapist,
        totalSessions,
        lastSessionDate: lastSessionDate.toISOString().split('T')[0],
        daysSinceLastSession,
        reason
      };
      
      if (status === 'ACTIVE') {
        activeClients.push(clientInfo);
      } else if (status === 'INACTIVE') {
        inactiveClients.push(clientInfo);
      } else {
        dropoutClients.push(clientInfo);
      }
    });

    console.log('\n📊 CLIENT STATUS ANALYSIS');
    console.log('='.repeat(80));
    console.log(`\nTotal Clients: ${clientMap.size}`);
    console.log(`Active: ${activeClients.length}`);
    console.log(`Inactive: ${inactiveClients.length}`);
    console.log(`Drop-out: ${dropoutClients.length}`);

    console.log('\n\n🟢 ACTIVE CLIENTS (Has session in last 30 days)');
    console.log('='.repeat(80));
    activeClients.slice(0, 10).forEach((client, i) => {
      console.log(`\n${i + 1}. ${client.name}`);
      console.log(`   Therapist: ${client.therapist}`);
      console.log(`   Total Sessions: ${client.totalSessions}`);
      console.log(`   Last Session: ${client.lastSessionDate} (${client.daysSinceLastSession} days ago)`);
      console.log(`   Reason: ${client.reason}`);
    });
    if (activeClients.length > 10) {
      console.log(`\n... and ${activeClients.length - 10} more active clients`);
    }

    console.log('\n\n🟡 INACTIVE CLIENTS (>1 session, but >30 days since last)');
    console.log('='.repeat(80));
    inactiveClients.forEach((client, i) => {
      console.log(`\n${i + 1}. ${client.name}`);
      console.log(`   Therapist: ${client.therapist}`);
      console.log(`   Total Sessions: ${client.totalSessions}`);
      console.log(`   Last Session: ${client.lastSessionDate} (${client.daysSinceLastSession} days ago)`);
      console.log(`   Reason: ${client.reason}`);
    });

    console.log('\n\n🔴 DROP-OUT CLIENTS (Only 1 session, >30 days ago)');
    console.log('='.repeat(80));
    dropoutClients.forEach((client, i) => {
      console.log(`\n${i + 1}. ${client.name}`);
      console.log(`   Therapist: ${client.therapist}`);
      console.log(`   Total Sessions: ${client.totalSessions}`);
      console.log(`   Last Session: ${client.lastSessionDate} (${client.daysSinceLastSession} days ago)`);
      console.log(`   Reason: ${client.reason}`);
    });

    console.log('\n\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log(`Active: ${activeClients.length} clients`);
    console.log(`Inactive: ${inactiveClients.length} clients`);
    console.log(`Drop-out: ${dropoutClients.length} clients`);
    console.log('='.repeat(80) + '\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeClientStatus();
