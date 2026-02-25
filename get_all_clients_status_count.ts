import pool from './lib/db.ts';

async function getAllClientsStatusCount() {
  try {
    console.log('\n📊 ALL CLIENTS STATUS COUNT');
    console.log('='.repeat(80));

    // Get all bookings grouped by client (email primary, phone fallback)
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_start_at,
        booking_status
      FROM bookings
      ORDER BY invitee_email, invitee_phone, booking_start_at DESC
    `);

    // Group by email (primary) or phone (fallback)
    const clientMap = new Map();
    const emailToKey = new Map();
    const phoneToKey = new Map();
    
    result.rows.forEach(row => {
      const email = row.invitee_email ? row.invitee_email.toLowerCase().trim() : null;
      const phone = row.invitee_phone ? row.invitee_phone.replace(/[\s\-\(\)\+]/g, '') : null;
      
      let key = null;
      
      // Check if email already exists (PRIMARY)
      if (email && emailToKey.has(email)) {
        key = emailToKey.get(email);
      }
      // Check if phone already exists
      else if (phone && phoneToKey.has(phone)) {
        key = phoneToKey.get(phone);
      }
      // New client
      else {
        key = email || phone || `unknown-${clientMap.size}`;
      }
      
      if (!key) return;
      
      // Map both email and phone to this key
      if (email) emailToKey.set(email, key);
      if (phone) phoneToKey.set(phone, key);
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: row.invitee_name,
          email: row.invitee_email,
          phone: row.invitee_phone,
          sessions: []
        });
      }
      
      clientMap.get(key).sessions.push({
        date: new Date(row.booking_start_at),
        status: row.booking_status
      });
    });

    console.log(`\n📈 Total Unique Clients: ${clientMap.size}`);
    console.log('='.repeat(80));

    // Calculate status for each client
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let activeCount = 0;
    let inactiveCount = 0;
    let dropoutCount = 0;
    
    const activeClients: any[] = [];
    const inactiveClients: any[] = [];
    const dropoutClients: any[] = [];
    
    clientMap.forEach((client, key) => {
      // Filter out cancelled sessions
      const nonCancelledSessions = client.sessions.filter(s => 
        s.status !== 'cancelled' && s.status !== 'canceled'
      );
      
      if (nonCancelledSessions.length === 0) {
        // No valid sessions, count as inactive
        inactiveCount++;
        inactiveClients.push({
          name: client.name,
          email: client.email,
          phone: client.phone,
          totalSessions: 0,
          reason: 'No non-cancelled sessions'
        });
        return;
      }
      
      // Check if has recent session (last 30 days)
      const hasRecentSession = nonCancelledSessions.some(s => s.date >= thirtyDaysAgo);
      
      const lastSession = nonCancelledSessions[0];
      const daysSinceLastSession = Math.floor((new Date().getTime() - lastSession.date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (hasRecentSession) {
        activeCount++;
        activeClients.push({
          name: client.name,
          email: client.email,
          phone: client.phone,
          totalSessions: nonCancelledSessions.length,
          lastSession: lastSession.date.toISOString().split('T')[0],
          daysSince: daysSinceLastSession
        });
      } else if (nonCancelledSessions.length === 1) {
        dropoutCount++;
        dropoutClients.push({
          name: client.name,
          email: client.email,
          phone: client.phone,
          totalSessions: 1,
          lastSession: lastSession.date.toISOString().split('T')[0],
          daysSince: daysSinceLastSession
        });
      } else {
        inactiveCount++;
        inactiveClients.push({
          name: client.name,
          email: client.email,
          phone: client.phone,
          totalSessions: nonCancelledSessions.length,
          lastSession: lastSession.date.toISOString().split('T')[0],
          daysSince: daysSinceLastSession
        });
      }
    });

    console.log('\n📊 STATUS BREAKDOWN:');
    console.log('='.repeat(80));
    console.log(`🟢 Active:    ${activeCount} clients (${((activeCount/clientMap.size)*100).toFixed(1)}%)`);
    console.log(`🟡 Inactive:  ${inactiveCount} clients (${((inactiveCount/clientMap.size)*100).toFixed(1)}%)`);
    console.log(`🔴 Drop-out:  ${dropoutCount} clients (${((dropoutCount/clientMap.size)*100).toFixed(1)}%)`);
    console.log('='.repeat(80));
    console.log(`📈 TOTAL:     ${clientMap.size} clients`);

    console.log('\n\n🟢 ACTIVE CLIENTS (Sample - First 10):');
    console.log('='.repeat(80));
    activeClients.slice(0, 10).forEach((client, i) => {
      console.log(`${i + 1}. ${client.name}`);
      console.log(`   Email: ${client.email || 'N/A'}`);
      console.log(`   Phone: ${client.phone || 'N/A'}`);
      console.log(`   Sessions: ${client.totalSessions}`);
      console.log(`   Last Session: ${client.lastSession} (${client.daysSince} days ago)`);
      console.log('');
    });
    if (activeClients.length > 10) {
      console.log(`... and ${activeClients.length - 10} more active clients\n`);
    }

    console.log('\n🟡 INACTIVE CLIENTS (All):');
    console.log('='.repeat(80));
    if (inactiveClients.length === 0) {
      console.log('No inactive clients found.\n');
    } else {
      inactiveClients.forEach((client, i) => {
        console.log(`${i + 1}. ${client.name}`);
        console.log(`   Email: ${client.email || 'N/A'}`);
        console.log(`   Phone: ${client.phone || 'N/A'}`);
        console.log(`   Sessions: ${client.totalSessions}`);
        if (client.lastSession) {
          console.log(`   Last Session: ${client.lastSession} (${client.daysSince} days ago)`);
        } else {
          console.log(`   Reason: ${client.reason}`);
        }
        console.log('');
      });
    }

    console.log('\n🔴 DROP-OUT CLIENTS (All):');
    console.log('='.repeat(80));
    if (dropoutClients.length === 0) {
      console.log('No drop-out clients found.\n');
    } else {
      dropoutClients.forEach((client, i) => {
        console.log(`${i + 1}. ${client.name}`);
        console.log(`   Email: ${client.email || 'N/A'}`);
        console.log(`   Phone: ${client.phone || 'N/A'}`);
        console.log(`   Sessions: ${client.totalSessions}`);
        console.log(`   Last Session: ${client.lastSession} (${client.daysSince} days ago)`);
        console.log('');
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log(`Total Clients: ${clientMap.size}`);
    console.log(`Active: ${activeCount} (${((activeCount/clientMap.size)*100).toFixed(1)}%)`);
    console.log(`Inactive: ${inactiveCount} (${((inactiveCount/clientMap.size)*100).toFixed(1)}%)`);
    console.log(`Drop-out: ${dropoutCount} (${((dropoutCount/clientMap.size)*100).toFixed(1)}%)`);
    console.log('='.repeat(80) + '\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getAllClientsStatusCount();
