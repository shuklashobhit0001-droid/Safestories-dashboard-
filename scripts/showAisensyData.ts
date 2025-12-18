import pool from '../lib/db';

async function showData() {
  try {
    const result = await pool.query('SELECT * FROM Aisensy_campaign_api');
    console.log('Data in Aisensy_campaign_api table:');
    console.table(result.rows);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

showData();
