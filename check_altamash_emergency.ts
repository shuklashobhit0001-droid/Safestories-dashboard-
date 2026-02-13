import { Pool } from 'pg';

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false,
});

async function checkAltamashEmergency() {
  try {
    console.log('🔍 Checking emergency contact for Altamash Jaleel...\n');

    // Check for Altamash's bookings with emergency contact info
    const result = await pool.query(`
      SELECT 
        invitee_name,
        invitee_email,
        invitee_phone,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_number,
        booking_id,
        booking_status
      FROM bookings 
      WHERE invitee_name ILIKE '%Altamash%'
      ORDER BY booking_start_at DESC
      LIMIT 5
    `);

    if (result.rows.length > 0) {
      console.log(`Found ${result.rows.length} booking(s) for Altamash:\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. Booking ID: ${row.booking_id}`);
        console.log(`   Name: ${row.invitee_name}`);
        console.log(`   Email: ${row.invitee_email}`);
        console.log(`   Phone: ${row.invitee_phone}`);
        console.log(`   Status: ${row.booking_status}`);
        console.log(`   Emergency Contact Name: ${row.emergency_contact_name || 'NULL'}`);
        console.log(`   Emergency Contact Relation: ${row.emergency_contact_relation || 'NULL'}`);
        console.log(`   Emergency Contact Number: ${row.emergency_contact_number || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('❌ No bookings found for Altamash');
    }

    // Check if ANY bookings have emergency contact info
    console.log('\n📊 Sample bookings WITH emergency contact info:');
    const withEmergency = await pool.query(`
      SELECT 
        invitee_name,
        emergency_contact_name,
        emergency_contact_relation,
        emergency_contact_number
      FROM bookings 
      WHERE emergency_contact_name IS NOT NULL 
      AND emergency_contact_name != ''
      LIMIT 3
    `);

    if (withEmergency.rows.length > 0) {
      console.log(`Found ${withEmergency.rows.length} booking(s) with emergency contact:\n`);
      withEmergency.rows.forEach((row, index) => {
        console.log(`${index + 1}. Client: ${row.invitee_name}`);
        console.log(`   Emergency Contact: ${row.emergency_contact_name} (${row.emergency_contact_relation})`);
        console.log(`   Phone: ${row.emergency_contact_number}`);
        console.log('');
      });
    } else {
      console.log('❌ No bookings found with emergency contact information');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAltamashEmergency();