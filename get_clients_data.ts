import pool from './lib/db';

async function getClientsData() {
  try {
    const clients = ['Sayali patil', 'sakshi kamble', 'sneha'];

    console.log('\n👥 CLIENT DATA:\n');

    for (const clientName of clients) {
      const result = await pool.query(`
        SELECT DISTINCT
          invitee_name,
          invitee_phone,
          invitee_email,
          booking_host_name as therapist,
          booking_status,
          booking_start_at,
          client_rating
        FROM bookings
        WHERE LOWER(invitee_name) LIKE LOWER($1)
        ORDER BY booking_start_at DESC
        LIMIT 5
      `, [`%${clientName}%`]);

      if (result.rows.length === 0) {
        console.log(`❌ ${clientName} - No data found`);
        console.log('---');
        continue;
      }

      console.log(`✅ ${clientName.toUpperCase()}`);
      result.rows.forEach((row: any, idx: number) => {
        console.log(`\n  Booking ${idx + 1}:`);
        console.log(`    Name: ${row.invitee_name}`);
        console.log(`    Phone: ${row.invitee_phone}`);
        console.log(`    Email: ${row.invitee_email}`);
        console.log(`    Therapist: ${row.therapist}`);
        console.log(`    Status: ${row.booking_status}`);
        console.log(`    Date: ${row.booking_start_at}`);
        console.log(`    Rating: ${row.client_rating ? `⭐ ${row.client_rating}/5` : 'N/A'}`);
      });
      console.log('\n---');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getClientsData();
