import pool from './lib/db';

async function checkProfileUrl() {
  try {
    const result = await pool.query(`
      SELECT therapist_id, name, profile_picture_url 
      FROM therapists 
      WHERE profile_picture_url IS NOT NULL
      LIMIT 5;
    `);
    
    console.log('Therapists with profile pictures:');
    result.rows.forEach(row => {
      console.log(`\nTherapist: ${row.name}`);
      console.log(`ID: ${row.therapist_id}`);
      console.log(`URL: ${row.profile_picture_url}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProfileUrl();
