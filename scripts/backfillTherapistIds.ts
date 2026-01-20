import pool from '../lib/db.js';

async function backfillTherapistIds() {
  console.log('=== BACKFILLING THERAPIST IDs ===\n');

  try {
    // Get all therapists
    const { rows: therapists } = await pool.query('SELECT therapist_id, name FROM therapists');
    console.log(`Found ${therapists.length} therapists\n`);

    let totalUpdated = 0;

    for (const therapist of therapists) {
      const firstName = therapist.name.split(' ')[0];
      
      // Update bookings matching this therapist
      const result = await pool.query(
        `UPDATE bookings 
         SET therapist_id = $1 
         WHERE therapist_id IS NULL 
         AND booking_host_name ILIKE $2`,
        [therapist.therapist_id, `%${firstName}%`]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`✓ ${therapist.name}: Updated ${result.rowCount} bookings`);
        totalUpdated += result.rowCount;
      }
    }

    console.log(`\n=== COMPLETE ===`);
    console.log(`Total bookings updated: ${totalUpdated}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

backfillTherapistIds();
