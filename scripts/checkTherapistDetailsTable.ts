import pool from '../lib/db';

async function checkTherapistDetailsTable() {
  try {
    console.log('🔍 Checking therapist_details table...\n');

    // Check table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'therapist_details'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Table Structure:');
    console.table(structure.rows);

    // Check existing data
    const data = await pool.query(`
      SELECT id, request_id, name, email, phone, specializations, status, created_at
      FROM therapist_details
      ORDER BY created_at DESC;
    `);

    console.log('\n📊 Existing Data:');
    if (data.rows.length === 0) {
      console.log('No data yet (table is empty)');
    } else {
      console.table(data.rows);
    }

    // Check relationship with new_therapist_requests
    const requests = await pool.query(`
      SELECT 
        ntr.request_id,
        ntr.therapist_name,
        ntr.email,
        ntr.status as request_status,
        td.id as details_id,
        td.status as details_status
      FROM new_therapist_requests ntr
      LEFT JOIN therapist_details td ON ntr.request_id = td.request_id
      ORDER BY ntr.request_id DESC
      LIMIT 5;
    `);

    console.log('\n🔗 Relationship Check (Last 5 requests):');
    console.table(requests.rows);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTherapistDetailsTable();
