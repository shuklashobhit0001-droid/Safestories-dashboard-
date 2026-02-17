import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTherapistStats() {
  try {
    // Get a therapist user
    const userResult = await pool.query(
      'SELECT id, therapist_id, username FROM users WHERE role = $1 LIMIT 1',
      ['therapist']
    );

    if (userResult.rows.length === 0) {
      console.log('No therapist users found');
      return;
    }

    const user = userResult.rows[0];
    console.log('Testing for therapist:', user.username);
    console.log('User ID:', user.id);
    console.log('Therapist ID:', user.therapist_id);

    // Get therapist info
    const therapistResult = await pool.query(
      'SELECT * FROM therapists WHERE therapist_id = $1',
      [user.therapist_id]
    );

    const therapist = therapistResult.rows[0];
    const therapistFirstName = therapist?.name?.split(' ')[0] || user.username;
    console.log('Therapist name:', therapist?.name);
    console.log('Therapist first name for query:', therapistFirstName);

    // Test bookings query
    console.log('\n=== BOOKINGS QUERY ===');
    const bookingsQuery = `SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1`;
    console.log('Query:', bookingsQuery);
    console.log('Param:', `%${therapistFirstName}%`);
    
    const bookings = await pool.query(bookingsQuery, [`%${therapistFirstName}%`]);
    console.log('Bookings count:', bookings.rows[0].total);

    // Show sample bookings
    const sampleBookings = await pool.query(
      `SELECT booking_id, booking_host_name, booking_status, booking_start_at 
       FROM bookings 
       WHERE booking_host_name ILIKE $1 
       LIMIT 5`,
      [`%${therapistFirstName}%`]
    );
    console.log('\nSample bookings:');
    sampleBookings.rows.forEach(b => {
      console.log(`- ID: ${b.booking_id}, Host: ${b.booking_host_name}, Status: ${b.booking_status}, Date: ${b.booking_start_at}`);
    });

    // Test sessions completed query
    console.log('\n=== SESSIONS COMPLETED QUERY ===');
    const sessionsQuery = `
      SELECT COUNT(*) as total FROM bookings 
      WHERE booking_host_name ILIKE $1
      AND booking_start_at < NOW()
      AND booking_status NOT IN ($2, $3, $4, $5)
    `;
    console.log('Query:', sessionsQuery);
    
    const sessionsCompleted = await pool.query(
      sessionsQuery,
      [`%${therapistFirstName}%`, 'cancelled', 'canceled', 'no_show', 'no show']
    );
    console.log('Sessions completed count:', sessionsCompleted.rows[0].total);

    // Show sample completed sessions
    const sampleCompleted = await pool.query(
      `SELECT booking_id, booking_host_name, booking_status, booking_start_at 
       FROM bookings 
       WHERE booking_host_name ILIKE $1
       AND booking_start_at < NOW()
       AND booking_status NOT IN ($2, $3, $4, $5)
       LIMIT 5`,
      [`%${therapistFirstName}%`, 'cancelled', 'canceled', 'no_show', 'no show']
    );
    console.log('\nSample completed sessions:');
    sampleCompleted.rows.forEach(b => {
      console.log(`- ID: ${b.booking_id}, Host: ${b.booking_host_name}, Status: ${b.booking_status}, Date: ${b.booking_start_at}`);
    });

    // Check all distinct booking_host_name values
    console.log('\n=== ALL DISTINCT THERAPIST NAMES IN BOOKINGS ===');
    const distinctHosts = await pool.query(
      'SELECT DISTINCT booking_host_name FROM bookings ORDER BY booking_host_name LIMIT 20'
    );
    console.log('Distinct host names:');
    distinctHosts.rows.forEach(h => console.log(`- ${h.booking_host_name}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTherapistStats();
