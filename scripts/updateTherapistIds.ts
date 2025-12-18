import pool from '../lib/db';

async function updateTherapistIds() {
  try {
    // Update existing therapists with correct IDs
    await pool.query(`UPDATE therapists SET therapist_id = '59507' WHERE name = 'Aastha Yagnik'`);
    console.log('✓ Updated Aastha Yagnik → 59507');

    await pool.query(`UPDATE therapists SET therapist_id = '59509' WHERE name = 'Ambika Vaidya'`);
    console.log('✓ Updated Ambika Vaidya → 59509');

    await pool.query(`UPDATE therapists SET therapist_id = '58769' WHERE name = 'Anjali Pillai'`);
    console.log('✓ Updated Anjali Pillai → 58769');

    await pool.query(`UPDATE therapists SET therapist_id = '59508' WHERE name = 'Indrayani Hinge'`);
    console.log('✓ Updated Indrayani Hinge → 59508');

    await pool.query(`UPDATE therapists SET therapist_id = '59510' WHERE name = 'Muskan Negi'`);
    console.log('✓ Updated Muskan Negi → 59510');

    // Add new therapist - safestories
    await pool.query(`
      INSERT INTO therapists (therapist_id, name, specialization, contact_info)
      VALUES ('58605', 'safestories', '', '')
    `);
    console.log('✓ Added new therapist: safestories → 58605');

    console.log('\n✓ All therapist IDs updated successfully!');
    
    // Show updated therapists
    const result = await pool.query(`SELECT therapist_id, name FROM therapists ORDER BY name`);
    console.log('\nUpdated therapists list:');
    result.rows.forEach(row => {
      console.log(`  ${row.name} → ${row.therapist_id}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error updating therapist IDs:', error);
    process.exit(1);
  }
}

updateTherapistIds();
