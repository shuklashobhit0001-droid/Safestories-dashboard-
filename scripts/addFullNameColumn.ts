import pool from '../lib/db';

async function addFullNameColumn() {
  try {
    // Add full_name column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
    `);
    console.log('✓ Added full_name column to users table');

    // Update Ishika's full name from therapists table
    await pool.query(`
      UPDATE users u
      SET full_name = t.name
      FROM therapists t
      WHERE u.therapist_id = t.therapist_id
        AND u.role = 'therapist'
        AND u.therapist_id = '58768';
    `);
    console.log('✓ Updated Ishika full name');

    // Verify
    const result = await pool.query(`
      SELECT id, username, role, therapist_id, full_name 
      FROM users 
      WHERE role = 'therapist'
    `);
    console.log('\nUpdated therapist users:');
    console.table(result.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addFullNameColumn();
