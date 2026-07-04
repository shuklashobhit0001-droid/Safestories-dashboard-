import pool from './lib/db';

async function auditHitasha() {
  try {
    console.log(`\n🔍 HITASHA - CREATION AUDIT\n`);

    // Check booking creation time
    console.log('1️⃣  bookings table:');
    const bookings = await pool.query(`
      SELECT
        invitee_name,
        invitee_email,
        booking_start_at,
        created_at,
        updated_at
      FROM bookings
      WHERE LOWER(invitee_name) = 'hitasha'
      AND invitee_email = 'hitasha.mansharamani@gmail.com'
      ORDER BY created_at ASC
    `);

    if (bookings.rows.length > 0) {
      bookings.rows.forEach(row => {
        console.log(`Booking Created: ${row.created_at}`);
        console.log(`Booking Updated: ${row.updated_at}`);
        console.log(`Session Date: ${row.booking_start_at}`);
      });
    }

    // Check audit logs for Hitasha
    console.log('\n2️⃣  audit_logs:');
    const audit = await pool.query(`
      SELECT
        id,
        table_name,
        operation,
        client_email,
        created_at,
        changes
      FROM audit_logs
      WHERE client_email = 'hitasha.mansharamani@gmail.com'
      OR changes LIKE '%Hitasha%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log(`Found: ${audit.rows.length}`);
    if (audit.rows.length > 0) {
      audit.rows.forEach(row => {
        console.log(`  [${row.operation}] ${row.table_name} - ${row.created_at}`);
      });
    }

    // Check if exists in leads deleted/archived
    console.log('\n3️⃣  leads (if exists):');
    const leads = await pool.query(`
      SELECT id, name, email, created_at FROM leads
      WHERE email = 'hitasha.mansharamani@gmail.com'
    `);
    console.log(`Found: ${leads.rows.length}`);
    if (leads.rows.length === 0) {
      console.log('❌ NOT IN LEADS (never created or deleted)');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

auditHitasha();
