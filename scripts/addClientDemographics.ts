import { Pool } from 'pg';

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false,
});

async function addClientDemographics() {
  try {
    console.log('🔧 Adding demographic fields to bookings table...\n');

    // Add demographic columns
    const alterQuery = `
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS invitee_age INTEGER,
      ADD COLUMN IF NOT EXISTS invitee_gender VARCHAR(50),
      ADD COLUMN IF NOT EXISTS invitee_occupation VARCHAR(255),
      ADD COLUMN IF NOT EXISTS invitee_marital_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS clinical_profile TEXT;
    `;

    await pool.query(alterQuery);
    console.log('✅ Successfully added demographic fields:');
    console.log('   - invitee_age (INTEGER)');
    console.log('   - invitee_gender (VARCHAR)');
    console.log('   - invitee_occupation (VARCHAR)');
    console.log('   - invitee_marital_status (VARCHAR)');
    console.log('   - clinical_profile (TEXT)');

    // Verify the columns were added
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name IN ('invitee_age', 'invitee_gender', 'invitee_occupation', 'invitee_marital_status', 'clinical_profile')
    `;

    const result = await pool.query(verifyQuery);
    console.log('\n✅ Verification - Columns added:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error adding demographic fields:', error);
  } finally {
    await pool.end();
  }
}

addClientDemographics();