import pool from '../lib/db';

async function checkDashboardApiBooking() {
  try {
    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'dashboard_api_booking'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 TABLE STRUCTURE:\n');
    structure.rows.forEach(col => {
      console.log(`${col.column_name} - ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
    });

    // Get all data
    const data = await pool.query('SELECT * FROM dashboard_api_booking LIMIT 10');
    
    console.log('\n📊 DATA (First 10 rows):\n');
    console.log(JSON.stringify(data.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDashboardApiBooking();
