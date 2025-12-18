import pool from '../lib/db';

async function renameColumns() {
  try {
    await pool.query('ALTER TABLE Aisensy_campaign_api RENAME COLUMN field TO Therapy');
    await pool.query('ALTER TABLE Aisensy_campaign_api RENAME COLUMN field_name TO Therapist_name');
    console.log('✅ Columns renamed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

renameColumns();
