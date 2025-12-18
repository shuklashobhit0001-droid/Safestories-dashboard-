import pool from '../lib/db';

async function checkTherapists() {
  try {
    const result = await pool.query(`
      SELECT therapist_id, name, specialization, contact_info, capacity
      FROM therapists
      ORDER BY name
    `);
    
    console.log('\nTherapists in database:');
    if (result.rows.length === 0) {
      console.log('No therapists found');
    } else {
      result.rows.forEach(row => {
        console.log(`\nID: ${row.therapist_id}`);
        console.log(`Name: ${row.name}`);
        console.log(`Specialization: ${row.specialization}`);
        console.log(`Contact: ${row.contact_info}`);
        console.log(`Capacity: ${row.capacity}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTherapists();
