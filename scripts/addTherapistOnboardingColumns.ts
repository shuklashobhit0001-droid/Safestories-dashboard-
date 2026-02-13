import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: false
});

async function addTherapistOnboardingColumns() {
  try {
    console.log('Adding therapist onboarding columns...');

    // Add columns to new_therapist_requests table
    await pool.query(`
      ALTER TABLE new_therapist_requests
      ADD COLUMN IF NOT EXISTS otp_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
    `);
    console.log('✓ Added columns to new_therapist_requests table');

    // Add columns to therapists table
    await pool.query(`
      ALTER TABLE therapists
      ADD COLUMN IF NOT EXISTS qualification_pdf_url TEXT,
      ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
      ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
    `);
    console.log('✓ Added columns to therapists table');

    console.log('✅ All columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await pool.end();
  }
}

addTherapistOnboardingColumns();
