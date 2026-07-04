import pool from './lib/db';

async function searchHitasha() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        phone,
        email,
        status,
        source,
        therapist_id,
        stage_booked_first_session_at,
        created_at
      FROM leads
      WHERE LOWER(name) LIKE '%hitasha%'
      ORDER BY created_at DESC
    `);

    console.log(`\n🔍 HITASHA SEARCH\n`);
    console.log(`Found: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('❌ NO RESULTS');
      process.exit(0);
    }

    result.rows.forEach((row: any, idx: number) => {
      console.log(`${idx + 1}. ${row.name}`);
      console.log(`   Phone: ${row.phone}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Source: ${row.source}`);
      console.log(`   Therapist ID: ${row.therapist_id || 'NOT ASSIGNED'}`);
      console.log(`   First Session: ${row.stage_booked_first_session_at || 'NOT BOOKED'}`);
      console.log(`   Created: ${row.created_at}`);
      console.log('   ---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

searchHitasha();
