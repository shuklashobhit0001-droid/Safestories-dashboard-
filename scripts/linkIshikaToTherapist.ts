import pool from '../lib/db';

async function linkIshikaToTherapist() {
  try {
    // First, add therapist_id column to users table if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS therapist_id VARCHAR(50);
    `);
    
    console.log('Added therapist_id column to users table');

    // Update Ishika's user record to link to therapist record
    const result = await pool.query(`
      UPDATE users 
      SET therapist_id = '58768'
      WHERE username = 'Ishika' AND role = 'therapist'
      RETURNING *;
    `);
    
    if (result.rows.length > 0) {
      console.log('Successfully linked Ishika user to therapist record:');
      console.log(result.rows[0]);
    } else {
      console.log('No Ishika user found to update');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error linking Ishika to therapist:', error);
    process.exit(1);
  }
}

linkIshikaToTherapist();