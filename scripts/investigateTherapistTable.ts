import pool from '../lib/db';

async function investigateTherapistTable() {
  try {
    console.log('INVESTIGATING THERAPIST TABLE\n');
    console.log('='.repeat(100));
    
    // 1. Check all therapists in the table
    console.log('\n1. ALL THERAPISTS IN TABLE:\n');
    const allTherapists = await pool.query('SELECT * FROM therapists ORDER BY id');
    console.log(`Total therapists: ${allTherapists.rows.length}\n`);
    allTherapists.rows.forEach(t => {
      console.log(`  ID: ${t.id}, Therapist_ID: ${t.therapist_id}, Name: ${t.name}`);
    });
    
    // 2. Check bookings with therapist_id
    console.log('\n\n2. UNIQUE THERAPIST IDs IN BOOKINGS:\n');
    const bookingTherapists = await pool.query(`
      SELECT DISTINCT therapist_id, COUNT(*) as booking_count
      FROM bookings
      WHERE therapist_id IS NOT NULL
      GROUP BY therapist_id
      ORDER BY therapist_id;
    `);
    console.log(`Unique therapist IDs in bookings: ${bookingTherapists.rows.length}\n`);
    bookingTherapists.rows.forEach(t => {
      console.log(`  Therapist ID: ${t.therapist_id}, Bookings: ${t.booking_count}`);
    });
    
    // 3. Check for missing therapists
    console.log('\n\n3. MISSING THERAPIST IDs:\n');
    const missing = await pool.query(`
      SELECT DISTINCT b.therapist_id, COUNT(*) as booking_count
      FROM bookings b
      LEFT JOIN therapists t ON b.therapist_id::integer = t.id
      WHERE b.therapist_id IS NOT NULL
        AND t.id IS NULL
      GROUP BY b.therapist_id
      ORDER BY b.therapist_id;
    `);
    console.log(`Therapist IDs in bookings but NOT in therapists table: ${missing.rows.length}\n`);
    missing.rows.forEach(t => {
      console.log(`  Missing ID: ${t.therapist_id}, Bookings affected: ${t.booking_count}`);
    });
    
    // 4. Check sample bookings with missing therapist IDs
    console.log('\n\n4. SAMPLE BOOKINGS WITH MISSING THERAPIST IDs:\n');
    const sampleBookings = await pool.query(`
      SELECT booking_id, invitee_name, booking_resource_name, therapist_id, booking_start_at
      FROM bookings
      WHERE therapist_id IN ('58768', '59507')
      ORDER BY booking_start_at DESC
      LIMIT 5;
    `);
    sampleBookings.rows.forEach(b => {
      console.log(`  Booking ${b.booking_id}: ${b.invitee_name}`);
      console.log(`    Event: ${b.booking_resource_name}`);
      console.log(`    Therapist ID: ${b.therapist_id}`);
      console.log(`    Date: ${b.booking_start_at}\n`);
    });
    
    // 5. Check if therapist names are in the event names
    console.log('\n5. THERAPIST NAMES FROM EVENT NAMES:\n');
    const eventNames = await pool.query(`
      SELECT DISTINCT booking_resource_name, therapist_id
      FROM bookings
      WHERE therapist_id IN ('58768', '59507')
      LIMIT 10;
    `);
    eventNames.rows.forEach(e => {
      console.log(`  Event: ${e.booking_resource_name}`);
      console.log(`  Therapist ID: ${e.therapist_id}\n`);
    });
    
    // 6. Check users table for therapist data
    console.log('\n6. CHECKING USERS TABLE FOR THERAPIST DATA:\n');
    const users = await pool.query(`
      SELECT id, username, full_name, role, therapist_id
      FROM users
      WHERE role = 'therapist'
      ORDER BY id;
    `);
    console.log(`Users with role 'therapist': ${users.rows.length}\n`);
    users.rows.forEach(u => {
      console.log(`  User ID: ${u.id}, Username: ${u.username}, Full Name: ${u.full_name}, Therapist ID: ${u.therapist_id}`);
    });
    
    // 7. Cross-reference users.therapist_id with bookings.therapist_id
    console.log('\n\n7. MATCHING USERS.THERAPIST_ID WITH BOOKINGS.THERAPIST_ID:\n');
    const match = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.full_name,
        u.therapist_id as user_therapist_id,
        COUNT(DISTINCT b.booking_id) as booking_count
      FROM users u
      LEFT JOIN bookings b ON u.therapist_id::text = b.therapist_id
      WHERE u.role = 'therapist'
      GROUP BY u.id, u.username, u.full_name, u.therapist_id
      ORDER BY u.id;
    `);
    match.rows.forEach(m => {
      console.log(`  ${m.username} (${m.full_name})`);
      console.log(`    User Therapist ID: ${m.user_therapist_id}`);
      console.log(`    Bookings: ${m.booking_count}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

investigateTherapistTable();
