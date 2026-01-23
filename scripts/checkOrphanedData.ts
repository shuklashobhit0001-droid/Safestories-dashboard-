import pool from '../lib/db';

async function checkOrphanedData() {
  try {
    // Check therapist_resources
    const check1 = await pool.query(`
      SELECT therapist_id, COUNT(*) 
      FROM therapist_resources 
      WHERE NOT EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = therapist_resources.therapist_id)
      GROUP BY therapist_id;
    `);
    console.log('therapist_resources orphaned:', check1.rows);

    // Check client_transfer_history
    const check2 = await pool.query(`
      SELECT from_therapist_id, to_therapist_id
      FROM client_transfer_history 
      WHERE NOT EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = client_transfer_history.from_therapist_id)
         OR NOT EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = client_transfer_history.to_therapist_id);
    `);
    console.log('client_transfer_history orphaned:', check2.rows);

    // Check client_additional_notes
    const check3 = await pool.query(`
      SELECT booking_id, COUNT(*) 
      FROM client_additional_notes 
      WHERE booking_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id::text = client_additional_notes.booking_id::text)
      GROUP BY booking_id;
    `);
    console.log('client_additional_notes orphaned:', check3.rows);

    // Check client_session_notes
    const check4 = await pool.query(`
      SELECT booking_id, COUNT(*) 
      FROM client_session_notes 
      WHERE booking_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = client_session_notes.booking_id)
      GROUP BY booking_id;
    `);
    console.log('client_session_notes orphaned:', check4.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrphanedData();
