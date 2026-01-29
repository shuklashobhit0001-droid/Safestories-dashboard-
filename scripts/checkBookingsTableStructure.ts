import pool from '../lib/db';

async function checkTableStructure() {
  try {
    console.log('Checking bookings table structure...\n');

    const query = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `;

    const result = await pool.query(query);
    
    console.log('Bookings table columns:');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
