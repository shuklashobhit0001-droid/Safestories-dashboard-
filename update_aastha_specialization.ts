import pool from './lib/db';

async function updateAasthaSpecialization() {
  const client = await pool.connect();
  
  try {
    console.log('Updating Aastha Yagnik specialization...\n');

    // First, show current data
    const beforeResult = await client.query(`
      SELECT id, name, specialization
      FROM therapists 
      WHERE name = 'Aastha Yagnik'
    `);
    console.log('Before update:', beforeResult.rows);

    // Update the specialization
    const updateResult = await client.query(`
      UPDATE therapists
      SET specialization = 'Individual Therapy, Adolescent Therapy'
      WHERE name = 'Aastha Yagnik'
      RETURNING id, name, specialization
    `);
    
    console.log('\nUpdate successful!');
    console.log('After update:', updateResult.rows);

    // Verify the update
    const verifyResult = await client.query(`
      SELECT id, name, specialization, LENGTH(specialization) as spec_length
      FROM therapists 
      WHERE name = 'Aastha Yagnik'
    `);
    console.log('\nVerification:', verifyResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateAasthaSpecialization();
