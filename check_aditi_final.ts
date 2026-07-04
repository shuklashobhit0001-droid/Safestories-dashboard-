import pool from './lib/db';

async function checkAditi() {
  try {
    console.log('\n🔍 ADITI 7447537497 - CRM LOOKUP\n');

    // Check leads table
    console.log('📌 leads (CRM):');
    const leads = await pool.query(`
      SELECT name, phone, email, status, stage_booked_first_session_at, remark_booked_first_session
      FROM leads
      WHERE phone LIKE '%7447537497%'
      OR email LIKE '%aditiharidas97%'
    `);
    console.log(`Found: ${leads.rows.length}\n`);
    if (leads.rows.length > 0) {
      leads.rows.forEach(row => {
        console.log(`Name: ${row.name}`);
        console.log(`Phone: ${row.phone}`);
        console.log(`Email: ${row.email}`);
        console.log(`Status: ${row.status}`);
        console.log(`First Session Booked: ${row.stage_booked_first_session_at}`);
        console.log(`Remark: ${row.remark_booked_first_session}`);
      });
    } else {
      console.log('NOT FOUND IN LEADS TABLE');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAditi();
