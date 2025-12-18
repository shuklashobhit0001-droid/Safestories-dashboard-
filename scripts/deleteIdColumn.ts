import pool from '../lib/db';

async function deleteIdColumn() {
  try {
    await pool.query('ALTER TABLE Aisensy_campaign_api DROP COLUMN id');
    console.log('✅ id column deleted successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

deleteIdColumn();
