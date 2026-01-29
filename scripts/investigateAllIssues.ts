import pool from '../lib/db';

async function investigateIssues() {
  try {
    // 1. Check therapists table structure and data
    console.log('1. CHECKING THERAPISTS TABLE\n');
    console.log('='.repeat(100));
    
    const therapistsQuery = `
      SELECT id, therapist_id, name, specialization, contact_info
      FROM therapists
      WHERE id IN (58768, 59507)
      ORDER BY id;
    `;
    
    const therapistsResult = await pool.query(therapistsQuery);
    console.log(`Found ${therapistsResult.rows.length} therapists:\n`);
    therapistsResult.rows.forEach(t => {
      console.log(`  ID: ${t.id}, Therapist ID: ${t.therapist_id}, Name: ${t.name}, Contact: ${t.contact_info}`);
    });

    // 2. Check therapist_id data type in bookings
    console.log('\n\n2. CHECKING THERAPIST_ID DATA TYPE IN BOOKINGS\n');
    console.log('='.repeat(100));
    
    const dataTypeQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'therapist_id';
    `;
    
    const dataTypeResult = await pool.query(dataTypeQuery);
    console.log(`therapist_id data type: ${dataTypeResult.rows[0]?.data_type}\n`);

    // 3. Test JOIN with explicit casting
    console.log('\n3. TESTING JOIN WITH DIFFERENT APPROACHES\n');
    console.log('='.repeat(100));
    
    const testJoinQuery = `
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.therapist_id,
        b.therapist_id::integer as therapist_id_int,
        t.id as therapist_table_id,
        t.name as therapist_name
      FROM bookings b
      LEFT JOIN therapists t ON b.therapist_id::integer = t.id
      WHERE DATE(b.booking_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-01-29'
        AND b.therapist_id IS NOT NULL;
    `;
    
    const testJoinResult = await pool.query(testJoinQuery);
    console.log(`Bookings with therapist_id (${testJoinResult.rows.length}):\n`);
    testJoinResult.rows.forEach(b => {
      console.log(`  Booking: ${b.booking_id}, Client: ${b.invitee_name}`);
      console.log(`    therapist_id (text): "${b.therapist_id}"`);
      console.log(`    therapist_id (int): ${b.therapist_id_int}`);
      console.log(`    therapist_table_id: ${b.therapist_table_id}`);
      console.log(`    therapist_name: ${b.therapist_name}\n`);
    });

    // 4. Check live sessions count logic
    console.log('\n4. CHECKING LIVE SESSIONS COUNT LOGIC\n');
    console.log('='.repeat(100));
    
    const liveSessionsQuery = `
      SELECT 
        COUNT(*) as live_count,
        COUNT(DISTINCT therapist_id) as unique_therapists
      FROM bookings
      WHERE booking_start_at <= NOW()
        AND booking_end_at > NOW()
        AND booking_status = 'active';
    `;
    
    const liveSessionsResult = await pool.query(liveSessionsQuery);
    console.log(`Live sessions (status='active', started, not ended): ${liveSessionsResult.rows[0].live_count}`);
    console.log(`Unique therapists in session: ${liveSessionsResult.rows[0].unique_therapists}\n`);

    // 5. Check if there are any 'active' status bookings today
    console.log('\n5. CHECKING ALL ACTIVE STATUS BOOKINGS TODAY\n');
    console.log('='.repeat(100));
    
    const activeBookingsQuery = `
      SELECT 
        booking_id,
        invitee_name,
        booking_resource_name,
        booking_start_at,
        booking_end_at,
        booking_status,
        therapist_id
      FROM bookings
      WHERE DATE(booking_start_at AT TIME ZONE 'Asia/Kolkata') = '2026-01-29'
        AND booking_status = 'active';
    `;
    
    const activeBookingsResult = await pool.query(activeBookingsQuery);
    console.log(`Active bookings today: ${activeBookingsResult.rows.length}\n`);
    if (activeBookingsResult.rows.length > 0) {
      activeBookingsResult.rows.forEach(b => {
        console.log(`  ${b.booking_id}: ${b.invitee_name} - ${b.booking_status}`);
        console.log(`    Start: ${b.booking_start_at}, End: ${b.booking_end_at}\n`);
      });
    }

    // 6. Check all possible statuses in bookings
    console.log('\n6. ALL BOOKING STATUSES IN DATABASE\n');
    console.log('='.repeat(100));
    
    const statusesQuery = `
      SELECT booking_status, COUNT(*) as count
      FROM bookings
      GROUP BY booking_status
      ORDER BY count DESC;
    `;
    
    const statusesResult = await pool.query(statusesQuery);
    console.log('All statuses in bookings table:\n');
    statusesResult.rows.forEach(s => {
      console.log(`  ${s.booking_status}: ${s.count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

investigateIssues();
