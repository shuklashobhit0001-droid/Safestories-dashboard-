import pool from '../lib/db';

async function updateData() {
  const updates = [
    ['ishika_adolescenttherapy_bookinglink_n8n', 'Adolescent Therapy', 'Ishika Mahajan'],
    ['ishika_individualtherapy_booking_link_n8n', 'Individual Therapy', 'Ishika Mahajan'],
    ['ishika_couplestherapy_booking_link_n8n', 'Couples Therapy', 'Ishika Mahajan'],
    ['indrayani_adolescenttherapy_booking_link_n8n', 'Adolescent Therapy', 'Indrayani Hinge'],
    ['indrayani_individualtherapy_booking_link_n8n', 'Individual Therapy', 'Indrayani Hinge'],
    ['anjali_adolescenttherapy_bookinglink_n8n', 'Adolescent Therapy', 'Anjali Pillai'],
    ['anjali_individualtherapy_booking_link_n8n', 'Individual Therapy', 'Anjali Pillai'],
    ['aastha_adolescenttherapy_booking_link_n8n', 'Adolescent Therapy', 'Aastha Yagnik'],
    ['aastha_individualtherapy_booking_link_n8n', 'Individual Therapy', 'Aastha Yagnik'],
    ['muskan_individualtherapy_booking_link_n8n', 'Individual Therapy', 'Muskan Negi'],
    ['ambika_adolescenttherapy_booking_link_n8n', 'Adolescent Therapy', 'Ambika Vaidya'],
    ['ambika_individualtherapy_booking_link_n8n', 'Individual Therapy', 'Ambika Vaidya'],
    ['free_consultation_bookinglink_n8n', 'Free Consultation', 'Safestories']
  ];

  try {
    for (const [campaign, therapy, therapist] of updates) {
      await pool.query(
        'UPDATE Aisensy_campaign_api SET therapy = $1, therapist_name = $2 WHERE campaign_name = $3',
        [therapy, therapist, campaign]
      );
    }
    console.log('✅ All data updated successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

updateData();
