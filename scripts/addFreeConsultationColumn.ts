import pool from '../lib/db';

async function addFreeConsultationColumn() {
  try {
    await pool.query(`
      ALTER TABLE booking_requests 
      ADD COLUMN IF NOT EXISTS is_free_consultation BOOLEAN DEFAULT false
    `);
    
    console.log('✓ Added is_free_consultation column to booking_requests table');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addFreeConsultationColumn();
