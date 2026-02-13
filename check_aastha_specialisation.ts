import pool from './lib/db';

async function checkAasthaSpecialisation() {
  const client = await pool.connect();
  
  try {
    console.log('Checking Aastha Yagnik specialisation...\n');

    // Find Aastha Yagnik in therapists table
    const aasthaResult = await client.query(`
      SELECT id, therapist_id, name, specialization, contact_info, is_profile_complete
      FROM therapists 
      WHERE name ILIKE '%Aastha%' OR name ILIKE '%Yagnik%'
    `);

    console.log('Aastha Yagnik data:');
    console.log(JSON.stringify(aasthaResult.rows, null, 2));

    // Check all therapists to see the pattern
    console.log('\n--- All therapists specialization data ---');
    const allTherapistsResult = await client.query(`
      SELECT id, name, specialization, LENGTH(specialization) as spec_length, is_profile_complete
      FROM therapists
      ORDER BY name
    `);

    allTherapistsResult.rows.forEach((t: any) => {
      const specDisplay = t.specialization || '(empty)';
      console.log(`${t.name}: "${specDisplay}" (length: ${t.spec_length || 0}, profile_complete: ${t.is_profile_complete})`);
    });

    // Check if there's a users table with additional info
    console.log('\n--- Checking users table for Aastha ---');
    const usersResult = await client.query(`
      SELECT user_id, name, role, therapist_id
      FROM users
      WHERE name ILIKE '%Aastha%' OR name ILIKE '%Yagnik%'
    `);
    console.log(JSON.stringify(usersResult.rows, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAasthaSpecialisation();
