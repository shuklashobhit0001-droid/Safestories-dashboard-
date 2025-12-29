import pool from '../lib/db.js';

async function checkBookingsTable() {
  try {
    // Get table structure
    const structure = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);

    console.log('=== BOOKINGS TABLE COLUMNS ===');
    structure.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });

    // Get one sample entry
    const sample = await pool.query('SELECT * FROM bookings LIMIT 1');

    console.log('\n=== SAMPLE ENTRY ===');
    if (sample.rows.length > 0) {
      Object.entries(sample.rows[0]).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkBookingsTable();
