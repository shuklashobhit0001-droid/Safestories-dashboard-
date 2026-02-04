import pool from './lib/db.js';

async function checkClientStatus() {
  try {
    console.log('🔍 Checking database schema and client activity status...\n');
    
    // First, let's see what columns exist in the bookings table
    const schemaQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `;
    
    const schemaResult = await pool.query(schemaQuery);
    console.log('📋 Bookings table columns:');
    schemaResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    console.log('');
    
    // Get sample data to understand the structure
    const sampleQuery = `
      SELECT * FROM bookings 
      WHERE invitee_name IS NOT NULL 
      LIMIT 3
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    console.log('📊 Sample booking data:');
    console.log(JSON.stringify(sampleResult.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkClientStatus();