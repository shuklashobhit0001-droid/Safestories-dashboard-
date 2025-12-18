import pool from '../lib/db';

async function showColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'aisensy_campaign_api'
      ORDER BY ordinal_position
    `);
    console.log('Columns in Aisensy_campaign_api table:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

showColumns();
