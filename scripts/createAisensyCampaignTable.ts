import pool from '../lib/db';

async function createAisensyCampaignTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Aisensy_campaign_api (
        id SERIAL PRIMARY KEY,
        campaign_name VARCHAR(255),
        field VARCHAR(255),
        field_name VARCHAR(255)
      )
    `);
    console.log('✅ Aisensy_campaign_api table created successfully');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createAisensyCampaignTable();
