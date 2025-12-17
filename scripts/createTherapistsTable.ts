import pool from '../lib/db';

async function createTherapistsTable() {
  try {
    // Create therapists table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapists (
        id SERIAL PRIMARY KEY,
        therapist_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        specialization TEXT,
        contact_info VARCHAR(255),
        sessions_booked INTEGER DEFAULT 0,
        capacity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✓ Therapists table created successfully');
    
    // Insert therapist data
    const therapists = [
      { id: 'host_001', name: 'Anjali Pillai', specialization: 'Individual Therapy, Adolescent Therapy' },
      { id: 'host_002', name: 'Ishika Mahajan', specialization: 'Individual Therapy, Couples Therapy, Adolescent Therapy' },
      { id: 'host_003', name: 'Ambika Vaidya', specialization: 'Individual Therapy, Adolescent Therapy' },
      { id: 'host_004', name: 'Muskan Negi', specialization: 'Individual Therapy' },
      { id: 'host_005', name: 'Aastha Yagnik', specialization: 'Individual Therapy, Adolescent Therapy' },
      { id: 'host_006', name: 'Indrayani Hinge', specialization: 'Individual Therapy, Adolescent Therapy' },
    ];
    
    for (const therapist of therapists) {
      await pool.query(`
        INSERT INTO therapists (therapist_id, name, specialization)
        VALUES ($1, $2, $3)
        ON CONFLICT (therapist_id) DO NOTHING;
      `, [therapist.id, therapist.name, therapist.specialization]);
    }
    
    console.log('✓ Therapist data inserted successfully');
    
    // Show all therapists
    const result = await pool.query('SELECT * FROM therapists ORDER BY name;');
    console.log('\nTherapists in database:');
    console.log(result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTherapistsTable();
