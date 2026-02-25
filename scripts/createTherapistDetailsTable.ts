import pool from '../lib/db';

async function createTherapistDetailsTable() {
  try {
    console.log('🔧 Creating therapist_details table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapist_details (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES new_therapist_requests(request_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        specializations TEXT NOT NULL,
        specialization_details JSONB,
        qualification VARCHAR(255),
        qualification_pdf_url TEXT,
        profile_picture_url TEXT,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending_review',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ therapist_details table created successfully!');
    console.log('');
    console.log('Table structure:');
    console.log('- id: Serial primary key');
    console.log('- request_id: Links to new_therapist_requests');
    console.log('- name: Therapist full name');
    console.log('- email: Unique email address');
    console.log('- phone: Phone number with country code');
    console.log('- specializations: Comma-separated list');
    console.log('- specialization_details: JSON with price & description');
    console.log('- qualification: Qualification text');
    console.log('- qualification_pdf_url: S3/MinIO URL');
    console.log('- profile_picture_url: S3/MinIO URL');
    console.log('- password: Hashed password for login');
    console.log('- status: pending_review | approved | rejected');
    console.log('- created_at: Timestamp');
    console.log('- updated_at: Timestamp');

  } catch (error) {
    console.error('❌ Error creating therapist_details table:', error);
  } finally {
    await pool.end();
  }
}

createTherapistDetailsTable();
