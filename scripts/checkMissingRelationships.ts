import pool from '../lib/db';

async function checkMissingRelationships() {
  try {
    console.log('=== CHECKING POTENTIAL MISSING FOREIGN KEYS ===\n');

    // 1. booking_cancelled.booking_id → bookings.booking_id
    const check1 = await pool.query(`
      SELECT 
        'booking_cancelled → bookings' as relationship,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = bc.booking_id)) as matching,
        COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = bc.booking_id)) as orphaned
      FROM booking_cancelled bc;
    `);
    console.log('1. booking_cancelled.booking_id → bookings.booking_id');
    console.log(check1.rows[0]);
    console.log('');

    // 2. client_additional_notes.therapist_id → therapists.therapist_id
    const check2 = await pool.query(`
      SELECT 
        'client_additional_notes → therapists' as relationship,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL) as total,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = can.therapist_id)) as matching,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = can.therapist_id)) as orphaned
      FROM client_additional_notes can;
    `);
    console.log('2. client_additional_notes.therapist_id → therapists.therapist_id');
    console.log(check2.rows[0]);
    console.log('');

    // 3. payments.booking_id → bookings.booking_id
    const check3 = await pool.query(`
      SELECT 
        'payments → bookings' as relationship,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL) as total,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL AND EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = p.booking_id)) as matching,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = p.booking_id)) as orphaned
      FROM payments p;
    `);
    console.log('3. payments.booking_id → bookings.booking_id');
    console.log(check3.rows[0]);
    console.log('');

    // 4. client_session_notes.booking_id → bookings.booking_id
    const check4 = await pool.query(`
      SELECT 
        'client_session_notes → bookings' as relationship,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL) as total,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL AND EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = csn.booking_id)) as matching,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = csn.booking_id)) as orphaned
      FROM client_session_notes csn;
    `);
    console.log('4. client_session_notes.booking_id → bookings.booking_id');
    console.log(check4.rows[0]);
    console.log('');

    // 5. audit_logs.therapist_id → therapists.therapist_id
    const check5 = await pool.query(`
      SELECT 
        'audit_logs → therapists' as relationship,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL) as total,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = al.therapist_id)) as matching,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = al.therapist_id)) as orphaned
      FROM audit_logs al;
    `);
    console.log('5. audit_logs.therapist_id → therapists.therapist_id');
    console.log(check5.rows[0]);
    console.log('');

    // 6. users.therapist_id → therapists.therapist_id
    const check6 = await pool.query(`
      SELECT 
        'users → therapists' as relationship,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL) as total,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = u.therapist_id)) as matching,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = u.therapist_id)) as orphaned
      FROM users u;
    `);
    console.log('6. users.therapist_id → therapists.therapist_id');
    console.log(check6.rows[0]);
    console.log('');

    // 7. bookings.therapist_id → therapists.therapist_id
    const check7 = await pool.query(`
      SELECT 
        'bookings → therapists' as relationship,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL) as total,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = b.therapist_id)) as matching,
        COUNT(*) FILTER (WHERE therapist_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = b.therapist_id)) as orphaned
      FROM bookings b;
    `);
    console.log('7. bookings.therapist_id → therapists.therapist_id');
    console.log(check7.rows[0]);
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkMissingRelationships();
