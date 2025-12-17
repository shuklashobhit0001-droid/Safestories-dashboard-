import pool from '../lib/db';

async function checkBookingsTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in bookings table:');
    console.log('==========================');
    result.rows.forEach((row) => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookingsTable();
