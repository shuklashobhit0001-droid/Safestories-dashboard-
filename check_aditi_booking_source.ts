import pool from './lib/db';

async function checkSource() {
  try {
    console.log('\n🔍 ADITI BOOKING SOURCE\n');

    const result = await pool.query(`
      SELECT
        name,
        phone,
        email,
        created_at,
        created_by,
        source,
        stage_booked_first_session_at,
        remark_booked_first_session,
        tags
      FROM leads
      WHERE phone = '7447537497'
      AND email = 'aditiharidas97@gmail.com'
    `);

    if (result.rows.length > 0) {
      const lead = result.rows[0];
      console.log(`Name: ${lead.name}`);
      console.log(`Phone: ${lead.phone}`);
      console.log(`Email: ${lead.email}`);
      console.log(`\n📍 BOOKING SOURCE:`);
      console.log(`Created By: ${lead.created_by || 'NOT SET'}`);
      console.log(`Source: ${lead.source || 'NOT SET'}`);
      console.log(`Created At: ${lead.created_at}`);
      console.log(`Tags: ${lead.tags || 'NONE'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSource();
