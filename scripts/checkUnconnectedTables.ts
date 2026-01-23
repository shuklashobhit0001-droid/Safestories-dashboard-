import pool from '../lib/db';

async function checkUnconnectedTables() {
  try {
    console.log('=== CHECKING 4 UNCONNECTED TABLES ===\n');

    // 1. aisensy_campaign_api - check therapist_name
    console.log('1. aisensy_campaign_api.therapist_name vs therapists.name:\n');
    const check1 = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM therapists t WHERE t.name = a.therapist_name)) as matching,
        COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM therapists t WHERE t.name = a.therapist_name)) as orphaned
      FROM aisensy_campaign_api a
      WHERE therapist_name IS NOT NULL;
    `);
    console.log(check1.rows[0]);
    const sample1 = await pool.query(`SELECT * FROM aisensy_campaign_api LIMIT 3;`);
    console.log('Sample data:', sample1.rows);
    console.log('\n');

    // 2. notifications - check user_id
    console.log('2. notifications.user_id vs users/therapists:\n');
    const check2 = await pool.query(`
      SELECT 
        user_role,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE user_id IS NOT NULL) as with_user_id
      FROM notifications
      GROUP BY user_role;
    `);
    console.log('By role:', check2.rows);
    
    const check2b = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE user_id IS NOT NULL) as total_with_user_id,
        COUNT(*) FILTER (WHERE user_id IS NOT NULL AND EXISTS (SELECT 1 FROM therapists t WHERE t.therapist_id = n.user_id)) as matching_therapists,
        COUNT(*) FILTER (WHERE user_id IS NOT NULL AND EXISTS (SELECT 1 FROM users u WHERE u.id::text = n.user_id)) as matching_users
      FROM notifications n;
    `);
    console.log('Matching:', check2b.rows[0]);
    console.log('\n');

    // 3. client_doc_form - check booking_id
    console.log('3. client_doc_form.booking_id vs bookings.booking_id:\n');
    const check3 = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL) as with_booking_id,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL AND EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = c.booking_id)) as matching,
        COUNT(*) FILTER (WHERE booking_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = c.booking_id)) as orphaned
      FROM client_doc_form c;
    `);
    console.log(check3.rows[0]);
    const sample3 = await pool.query(`SELECT * FROM client_doc_form LIMIT 3;`);
    console.log('Sample data:', sample3.rows);
    console.log('\n');

    // 4. booking_requests - check therapist_name
    console.log('4. booking_requests.therapist_name vs therapists.name:\n');
    const check4 = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM therapists t WHERE t.name = br.therapist_name)) as matching,
        COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM therapists t WHERE t.name = br.therapist_name)) as orphaned
      FROM booking_requests br;
    `);
    console.log(check4.rows[0]);
    const sample4 = await pool.query(`SELECT therapist_name, client_name FROM booking_requests LIMIT 5;`);
    console.log('Sample data:', sample4.rows);
    console.log('\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUnconnectedTables();
