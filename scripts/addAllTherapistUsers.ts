import pool from '../lib/db';

async function addAllTherapistUsers() {
  try {
    const therapists = [
      { username: 'Aastha', password: 'Aastha123', therapist_id: '59507', full_name: 'Aastha Yagnik' },
      { username: 'Ambika', password: 'Ambika123', therapist_id: '59509', full_name: 'Ambika Vaidya' },
      { username: 'Anjali', password: 'Anjali123', therapist_id: '58769', full_name: 'Anjali Pillai' },
      { username: 'Indrayani', password: 'Indrayani123', therapist_id: '59508', full_name: 'Indrayani Hinge' },
      { username: 'Muskan', password: 'Muskan123', therapist_id: '59510', full_name: 'Muskan Negi' }
    ];

    for (const therapist of therapists) {
      await pool.query(`
        INSERT INTO users (username, password, name, role, therapist_id, full_name)
        VALUES ($1, $2, $3, 'therapist', $4, $5)
        ON CONFLICT (username) DO UPDATE 
        SET password = $2, name = $3, therapist_id = $4, full_name = $5
      `, [therapist.username, therapist.password, therapist.full_name, therapist.therapist_id, therapist.full_name]);
      
      console.log(`✓ Added/Updated user: ${therapist.username}`);
    }

    // Update Ishika's full name
    await pool.query(`
      UPDATE users 
      SET full_name = 'Ishika Mahajan', name = 'Ishika Mahajan'
      WHERE username = 'Ishika' AND role = 'therapist'
    `);
    console.log('✓ Updated Ishika full name');

    // Verify all therapist users
    const result = await pool.query(`
      SELECT id, username, role, therapist_id, full_name 
      FROM users 
      WHERE role = 'therapist'
      ORDER BY username
    `);
    
    console.log('\nAll therapist users:');
    console.table(result.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addAllTherapistUsers();
