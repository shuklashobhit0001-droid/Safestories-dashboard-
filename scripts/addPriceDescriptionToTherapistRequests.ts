import pool from '../api/lib/db.js';

async function addPriceDescriptionColumns() {
  try {
    console.log('Adding price and description columns to new_therapist_requests table...');
    
    await pool.query(`
      ALTER TABLE new_therapist_requests
      ADD COLUMN IF NOT EXISTS specialization_details JSONB DEFAULT '[]'::jsonb
    `);
    
    console.log('✅ Columns added successfully');
    
    // Check table structure
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'new_therapist_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('\nUpdated table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addPriceDescriptionColumns();
