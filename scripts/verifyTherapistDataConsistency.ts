import pool from '../lib/db';

async function verifyTherapistDataConsistency() {
  try {
    console.log('=== CHECKING THERAPIST DATA CONSISTENCY ===\n');

    // 1. client_additional_notes.therapist_id → therapists.therapist_id
    console.log('1. client_additional_notes vs therapists:\n');
    const check1 = await pool.query(`
      SELECT 
        can.therapist_id,
        can.therapist_name as notes_therapist_name,
        t.name as therapists_name,
        CASE WHEN can.therapist_name = t.name THEN '✅' ELSE '❌' END as name_match
      FROM client_additional_notes can
      JOIN therapists t ON can.therapist_id = t.therapist_id
      WHERE can.therapist_id IS NOT NULL;
    `);
    console.log(check1.rows);
    const mismatch1 = check1.rows.filter(r => r.name_match === '❌').length;
    console.log(`Mismatches: ${mismatch1}\n\n`);

    // 2. audit_logs.therapist_id → therapists.therapist_id
    console.log('2. audit_logs vs therapists (sample 5):\n');
    const check2 = await pool.query(`
      SELECT 
        al.therapist_id,
        al.therapist_name as audit_therapist_name,
        t.name as therapists_name,
        CASE WHEN al.therapist_name = t.name THEN '✅' ELSE '❌' END as name_match
      FROM audit_logs al
      JOIN therapists t ON al.therapist_id = t.therapist_id
      WHERE al.therapist_id IS NOT NULL
      LIMIT 5;
    `);
    console.log(check2.rows);
    const mismatch2 = await pool.query(`
      SELECT COUNT(*) as count
      FROM audit_logs al
      JOIN therapists t ON al.therapist_id = t.therapist_id
      WHERE al.therapist_name != t.name;
    `);
    console.log(`Total mismatches: ${mismatch2.rows[0].count}\n\n`);

    // 3. users.therapist_id → therapists.therapist_id
    console.log('3. users vs therapists:\n');
    const check3 = await pool.query(`
      SELECT 
        u.therapist_id,
        u.name as user_name,
        t.name as therapist_name,
        CASE WHEN u.name = t.name THEN '✅' ELSE '❌' END as name_match
      FROM users u
      JOIN therapists t ON u.therapist_id = t.therapist_id
      WHERE u.therapist_id IS NOT NULL;
    `);
    console.log(check3.rows);
    const mismatch3 = check3.rows.filter(r => r.name_match === '❌').length;
    console.log(`Mismatches: ${mismatch3}\n\n`);

    // 4. bookings.therapist_id → therapists.therapist_id
    console.log('4. bookings vs therapists (sample 5):\n');
    const check4 = await pool.query(`
      SELECT 
        b.therapist_id,
        b.booking_host_name as booking_therapist_name,
        t.name as therapists_name,
        CASE WHEN b.booking_host_name = t.name THEN '✅' ELSE '❌' END as name_match
      FROM bookings b
      JOIN therapists t ON b.therapist_id = t.therapist_id
      WHERE b.therapist_id IS NOT NULL
      LIMIT 5;
    `);
    console.log(check4.rows);
    const mismatch4 = await pool.query(`
      SELECT COUNT(*) as count
      FROM bookings b
      JOIN therapists t ON b.therapist_id = t.therapist_id
      WHERE b.booking_host_name != t.name;
    `);
    console.log(`Total mismatches: ${mismatch4.rows[0].count}\n\n`);

    // 5. booking_cancelled.booking_id → bookings.booking_id (already checked but verify again)
    console.log('5. booking_cancelled vs bookings:\n');
    const check5 = await pool.query(`
      SELECT 
        bc.booking_id,
        bc.invitee_name as cancelled_name,
        b.invitee_name as booking_name,
        bc.invitee_email as cancelled_email,
        b.invitee_email as booking_email,
        CASE WHEN bc.invitee_name = b.invitee_name AND bc.invitee_email = b.invitee_email THEN '✅' ELSE '❌' END as match
      FROM booking_cancelled bc
      JOIN bookings b ON bc.booking_id = b.booking_id;
    `);
    console.log(check5.rows);
    const mismatch5 = check5.rows.filter(r => r.match === '❌').length;
    console.log(`Mismatches: ${mismatch5}\n\n`);

    // 6. payments.booking_id → bookings.booking_id (already checked but verify again)
    console.log('6. payments vs bookings (sample 5):\n');
    const check6 = await pool.query(`
      SELECT 
        p.booking_id,
        p.invitee_name as payment_name,
        b.invitee_name as booking_name,
        CASE WHEN p.invitee_name = b.invitee_name THEN '✅' ELSE '❌' END as match
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      LIMIT 5;
    `);
    console.log(check6.rows);
    const mismatch6 = await pool.query(`
      SELECT COUNT(*) as count
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      WHERE p.invitee_name != b.invitee_name;
    `);
    console.log(`Total mismatches: ${mismatch6.rows[0].count}\n\n`);

    console.log('=== SUMMARY ===');
    console.log(`client_additional_notes: ${mismatch1} mismatches`);
    console.log(`audit_logs: ${mismatch2.rows[0].count} mismatches`);
    console.log(`users: ${mismatch3} mismatches`);
    console.log(`bookings: ${mismatch4.rows[0].count} mismatches`);
    console.log(`booking_cancelled: ${mismatch5} mismatches`);
    console.log(`payments: ${mismatch6.rows[0].count} mismatches`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyTherapistDataConsistency();
