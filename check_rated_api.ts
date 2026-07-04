import pool from './lib/db';

async function checkRatedInAPI() {
  try {
    // Query exactly what /api/appointments returns
    const result = await pool.query(`
      SELECT
        b.booking_id,
        b.invitee_name,
        b.booking_status,
        b.client_rating,
        b.booking_start_at,
        b.booking_host_name,
        (b.booking_start_at < NOW()) as is_past
      FROM bookings b
      WHERE b.invitee_name IN ('Pranoti Suranje', 'Pragna', 'Sonam', 'Suhas K', 'Nisha Jha')
      ORDER BY b.booking_start_at DESC
    `);

    console.log('\n🔍 CHECKING IF 5 RATED CLIENTS IN /api/appointments QUERY:\n');
    console.log(`Total found: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('❌ NO RESULTS - Clients not in bookings table or names don\'t match exactly');

      // Check if names have typos or variations
      const checkQuery = await pool.query(`
        SELECT DISTINCT invitee_name FROM bookings
        WHERE invitee_name ILIKE '%Pranoti%'
        OR invitee_name ILIKE '%Pragna%'
        OR invitee_name ILIKE '%Sonam%'
        OR invitee_name ILIKE '%Suhas%'
        OR invitee_name ILIKE '%Nisha%'
      `);

      console.log('\nPossible name variations found:');
      checkQuery.rows.forEach(row => {
        console.log(`- "${row.invitee_name}"`);
      });
    } else {
      result.rows.forEach((row: any) => {
        const status = row.is_past
          ? (row.client_rating ? 'SHOULD_SHOW_WITH_RATING' : 'pending_notes')
          : 'scheduled/upcoming';

        console.log(`✅ ${row.invitee_name}`);
        console.log(`   Rating: ${row.client_rating ? `⭐ ${row.client_rating}/5` : 'null'}`);
        console.log(`   DB Status: ${row.booking_status}`);
        console.log(`   Expected Tab: ${status}`);
        console.log('---');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRatedInAPI();
