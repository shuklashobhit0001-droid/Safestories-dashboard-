import pool from './lib/db';

async function debugRashida() {
  try {
    // Find Rashida's actual phone and email
    const rashidaResult = await pool.query(`
      SELECT DISTINCT
        invitee_phone,
        invitee_email
      FROM bookings
      WHERE invitee_name ILIKE '%Rashida%'
      LIMIT 1
    `);

    if (rashidaResult.rows.length === 0) {
      console.log('Rashida not found');
      process.exit(0);
    }

    const rashidaPhone = rashidaResult.rows[0].invitee_phone;
    const rashidaEmail = rashidaResult.rows[0].invitee_email;

    console.log('\n🔍 Rashida Details:');
    console.log(`Phone: ${rashidaPhone}`);
    console.log(`Email: ${rashidaEmail}`);

    // Check if this phone/email is used by OTHER clients
    console.log('\n🚨 Checking for phone/email conflicts:\n');

    // Query 1: Other clients with same phone
    const phoneConflict = await pool.query(`
      SELECT DISTINCT invitee_name, invitee_phone
      FROM bookings
      WHERE invitee_phone = $1
      AND invitee_name NOT ILIKE '%Rashida%'
      ORDER BY invitee_name
    `, [rashidaPhone]);

    if (phoneConflict.rows.length > 0) {
      console.log(`⚠️  PHONE CONFLICT - ${phoneConflict.rows.length} other clients with same phone:`);
      phoneConflict.rows.forEach(row => {
        console.log(`   - ${row.invitee_name} (${row.invitee_phone})`);
      });
    } else {
      console.log('✅ Phone unique to Rashida');
    }

    // Query 2: Other clients with same email
    const emailConflict = await pool.query(`
      SELECT DISTINCT invitee_name, invitee_email
      FROM bookings
      WHERE invitee_email = $1
      AND invitee_name NOT ILIKE '%Rashida%'
      ORDER BY invitee_name
    `, [rashidaEmail]);

    if (emailConflict.rows.length > 0) {
      console.log(`⚠️  EMAIL CONFLICT - ${emailConflict.rows.length} other clients with same email:`);
      emailConflict.rows.forEach(row => {
        console.log(`   - ${row.invitee_name} (${row.invitee_email})`);
      });
    } else {
      console.log('✅ Email unique to Rashida');
    }

    // Query 3: Check all bookings for Rashida
    console.log('\n📅 All Rashida bookings by actual phone/email:');
    const allBookings = await pool.query(`
      SELECT
        invitee_name,
        invitee_phone,
        invitee_email,
        booking_host_name as therapist,
        booking_start_at
      FROM bookings
      WHERE (invitee_phone = $1 OR invitee_email = $2)
      ORDER BY booking_start_at DESC
    `, [rashidaPhone, rashidaEmail]);

    console.log(`Total: ${allBookings.rows.length} bookings\n`);
    allBookings.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.invitee_name} | ${row.therapist} | ${row.booking_start_at}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugRashida();
