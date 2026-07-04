import pool from './lib/db';

async function checkAditi() {
  try {
    console.log('\n🔍 CHECKING CRM SOURCES FOR ADITI 7447537497\n');

    // Check leads table
    console.log('1️⃣  leads:');
    const leads = await pool.query(`
      SELECT * FROM leads
      WHERE phone_number LIKE '%7447537497%'
      OR email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${leads.rows.length}`);
    if (leads.rows.length > 0) {
      leads.rows.forEach(row => {
        console.log(`  Name: ${row.client_name || row.name}`);
        console.log(`  Phone: ${row.phone_number}`);
        console.log(`  Email: ${row.email}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Created: ${row.created_at}`);
        console.log('  ---');
      });
    }

    // Check booking_requests
    console.log('\n2️⃣  booking_requests:');
    const requests = await pool.query(`
      SELECT * FROM booking_requests
      WHERE phone_number LIKE '%7447537497%'
      OR email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${requests.rows.length}`);
    if (requests.rows.length > 0) {
      requests.rows.forEach(row => {
        console.log(`  Name: ${row.client_name || row.name}`);
        console.log(`  Phone: ${row.phone_number}`);
        console.log(`  Email: ${row.email}`);
        console.log('  ---');
      });
    }

    // Check client_logs
    console.log('\n3️⃣  client_logs:');
    const logs = await pool.query(`
      SELECT DISTINCT client_name, client_phone, client_email FROM client_logs
      WHERE client_phone LIKE '%7447537497%'
      OR client_email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${logs.rows.length}`);
    if (logs.rows.length > 0) {
      logs.rows.forEach(row => {
        console.log(`  ${row.client_name} | ${row.client_phone} | ${row.client_email}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAditi();
