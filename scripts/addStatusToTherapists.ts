import pool from '../lib/db';

async function addStatusColumn() {
  try {
    console.log('🔧 Adding status column to therapists table...');
    
    // Add status column with default 'approved' for existing therapists
    await pool.query(`
      ALTER TABLE therapists 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved'
    `);
    
    console.log('✅ Status column added successfully');
    
    // Update all existing therapists to have 'approved' status
    const updateResult = await pool.query(`
      UPDATE therapists 
      SET status = 'approved' 
      WHERE status IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} existing therapists to 'approved' status`);
    
    // Show current therapists with their status
    const therapists = await pool.query(`
      SELECT therapist_id, name, status 
      FROM therapists 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📊 Current therapists:');
    console.table(therapists.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addStatusColumn();
