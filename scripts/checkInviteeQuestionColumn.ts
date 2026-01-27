import pool from '../lib/db.js';

async function checkInviteeQuestionColumn() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'invitee_question';
    `);
    
    if (result.rows.length > 0) {
      console.log('invitee_question column found:');
      console.log(result.rows[0]);
    } else {
      console.log('invitee_question column NOT FOUND in bookings table');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkInviteeQuestionColumn();
