import pool from '../lib/db';

async function insertCampaignNames() {
  const campaigns = [
    'ishika_adolescenttherapy_bookinglink_n8n',
    'ishika_individualtherapy_booking_link_n8n',
    'ishika_couplestherapy_booking_link_n8n',
    'indrayani_adolescenttherapy_booking_link_n8n',
    'indrayani_individualtherapy_booking_link_n8n',
    'anjali_adolescenttherapy_bookinglink_n8n',
    'anjali_individualtherapy_booking_link_n8n',
    'aastha_adolescenttherapy_booking_link_n8n',
    'aastha_individualtherapy_booking_link_n8n',
    'muskan_individualtherapy_booking_link_n8n',
    'ambika_adolescenttherapy_booking_link_n8n',
    'ambika_individualtherapy_booking_link_n8n',
    'free_consultation_bookinglink_n8n'
  ];

  try {
    for (const campaign of campaigns) {
      await pool.query(
        'INSERT INTO Aisensy_campaign_api (campaign_name) VALUES ($1)',
        [campaign]
      );
    }
    console.log('✅ All campaign names inserted successfully');
  } catch (error) {
    console.error('❌ Error inserting campaigns:', error);
  } finally {
    await pool.end();
  }
}

insertCampaignNames();
