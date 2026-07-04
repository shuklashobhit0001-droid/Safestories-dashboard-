import pool from './lib/db';

async function checkTherapist() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        phone,
        email,
        therapist_id,
        stage_booked_first_session_at
      FROM leads
      WHERE phone = '7447537497'
      AND email = 'aditiharidas97@gmail.com'
    `);

    if (result.rows.length > 0) {
      const lead = result.rows[0];
      console.log(`\n👤 ADITI STATUS:\n`);
      console.log(`Name: ${lead.name}`);
      console.log(`Phone: ${lead.phone}`);
      console.log(`Email: ${lead.email}`);
      console.log(`Therapist ID: ${lead.therapist_id || '❌ NOT ASSIGNED'}`);
      console.log(`Session Booked: ${lead.stage_booked_first_session_at}`);

      if (lead.therapist_id) {
        // Get therapist name
        const therapist = await pool.query(`
          SELECT id, name FROM users WHERE id = $1
        `, [lead.therapist_id]);

        if (therapist.rows.length > 0) {
          console.log(`Therapist Name: ${therapist.rows[0].name}`);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTherapist();
