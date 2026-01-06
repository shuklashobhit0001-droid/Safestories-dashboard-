import pool from '../lib/db';

async function addTherapistIdToBookings() {
  try {
    // Add therapist_id column to bookings table
    await pool.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS therapist_id VARCHAR(255);
    `);
    console.log('✓ Added therapist_id column to bookings table');

    // Update existing bookings with therapist_id by matching therapist names
    await pool.query(`
      UPDATE bookings b
      SET therapist_id = t.therapist_id
      FROM therapists t
      WHERE b.booking_host_name ILIKE '%' || SPLIT_PART(t.name, ' ', 1) || '%'
      AND b.therapist_id IS NULL;
    `);
    console.log('✓ Updated existing bookings with therapist_id');

    // Show sample results
    const result = await pool.query(`
      SELECT booking_id, booking_host_name, therapist_id 
      FROM bookings 
      LIMIT 5;
    `);
    console.log('\nSample bookings with therapist_id:');
    console.log(result.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTherapistIdToBookings();
