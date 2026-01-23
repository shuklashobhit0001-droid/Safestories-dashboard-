import pool from '../lib/db';

async function showOrphanedData() {
  try {
    console.log('=== ORPHANED DATA ===\n');

    // 1. client_session_notes orphaned record
    console.log('1. client_session_notes - booking_id that doesn\'t exist in bookings:\n');
    const orphan1 = await pool.query(`
      SELECT * 
      FROM client_session_notes 
      WHERE booking_id = '56430';
    `);
    console.log(orphan1.rows[0]);
    console.log('\n');

    // 2. therapist_resources orphaned records
    console.log('2. therapist_resources - therapist_id that doesn\'t exist in therapists:\n');
    const orphan2 = await pool.query(`
      SELECT * 
      FROM therapist_resources 
      WHERE therapist_id = '58605';
    `);
    console.log(orphan2.rows);
    console.log('\n');

    // Check if these IDs exist in parent tables
    console.log('3. Verification:\n');
    const check1 = await pool.query(`SELECT COUNT(*) FROM bookings WHERE booking_id = '56430';`);
    console.log(`booking_id '56430' exists in bookings? ${check1.rows[0].count > 0 ? 'YES' : 'NO'}`);
    
    const check2 = await pool.query(`SELECT COUNT(*) FROM therapists WHERE therapist_id = '58605';`);
    console.log(`therapist_id '58605' exists in therapists? ${check2.rows[0].count > 0 ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

showOrphanedData();
