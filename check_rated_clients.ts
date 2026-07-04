import pool from './lib/db';

async function checkRatedClients() {
  try {
    const clients = ['Pranoti Suranje', 'Pragna', 'Sonam', 'Suhas K', 'Nisha Jha'];

    console.log('\n📊 CLIENTS WITH RATINGS - BOOKINGS STATUS:\n');

    for (const clientName of clients) {
      const result = await pool.query(`
        SELECT
          invitee_name,
          client_rating,
          booking_status,
          booking_host_name,
          booking_start_at,
          booking_id
        FROM bookings
        WHERE invitee_name ILIKE $1
        AND client_rating IS NOT NULL
        ORDER BY booking_start_at DESC
      `, [`%${clientName}%`]);

      if (result.rows.length > 0) {
        result.rows.forEach(row => {
          console.log(`✅ ${row.invitee_name}`);
          console.log(`   Rating: ⭐ ${row.client_rating}/5`);
          console.log(`   Status: ${row.booking_status}`);
          console.log(`   Therapist: ${row.booking_host_name}`);
          console.log(`   Date: ${row.booking_start_at}`);
          console.log(`   Booking ID: ${row.booking_id}`);
          console.log('---');
        });
      } else {
        console.log(`❌ ${clientName} - No rated bookings found`);
        console.log('---');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRatedClients();
