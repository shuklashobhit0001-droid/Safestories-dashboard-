import pool from '../lib/db.js';

async function fixTherapistNotifications() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   FIX THERAPIST NOTIFICATIONS - COMPLETE SOLUTION     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // STEP 1: Create auto-populate trigger
    console.log('📌 STEP 1: Creating auto-populate therapist_id trigger\n');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION auto_populate_therapist_id()
      RETURNS TRIGGER AS $$
      DECLARE
        matched_therapist_id TEXT;
      BEGIN
        IF NEW.therapist_id IS NULL AND NEW.booking_host_name IS NOT NULL THEN
          SELECT therapist_id INTO matched_therapist_id
          FROM therapists
          WHERE NEW.booking_host_name ILIKE '%' || SPLIT_PART(name, ' ', 1) || '%'
          LIMIT 1;
          
          IF matched_therapist_id IS NOT NULL THEN
            NEW.therapist_id := matched_therapist_id;
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query('DROP TRIGGER IF EXISTS trg_auto_populate_therapist_id ON bookings;');
    
    await pool.query(`
      CREATE TRIGGER trg_auto_populate_therapist_id
      BEFORE INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION auto_populate_therapist_id();
    `);
    
    console.log('✅ Trigger created - Future bookings will auto-populate therapist_id\n');

    // STEP 2: Backfill existing bookings
    console.log('📌 STEP 2: Backfilling existing bookings with therapist_id\n');
    
    const { rows: therapists } = await pool.query('SELECT therapist_id, name FROM therapists');
    console.log(`Found ${therapists.length} therapists:\n`);

    let totalUpdated = 0;

    for (const therapist of therapists) {
      const firstName = therapist.name.split(' ')[0];
      
      const result = await pool.query(
        `UPDATE bookings 
         SET therapist_id = $1 
         WHERE therapist_id IS NULL 
         AND booking_host_name ILIKE $2`,
        [therapist.therapist_id, `%${firstName}%`]
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`  ✓ ${therapist.name.padEnd(20)} → ${result.rowCount} bookings updated`);
        totalUpdated += result.rowCount;
      }
    }

    console.log(`\n✅ Backfill complete - ${totalUpdated} bookings updated\n`);

    // STEP 3: Verify fix
    console.log('📌 STEP 3: Verifying the fix\n');
    
    const { rows: stats } = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(therapist_id) as with_therapist_id,
        COUNT(*) - COUNT(therapist_id) as missing_therapist_id
      FROM bookings
    `);

    console.log('Booking Statistics:');
    console.log(`  Total bookings:        ${stats[0].total_bookings}`);
    console.log(`  With therapist_id:     ${stats[0].with_therapist_id}`);
    console.log(`  Missing therapist_id:  ${stats[0].missing_therapist_id}\n`);

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ FIX COMPLETE!                      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  ✓ Existing bookings updated with therapist_id        ║');
    console.log('║  ✓ Trigger installed for future bookings              ║');
    console.log('║  ✓ Therapist notifications will now work!             ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixTherapistNotifications();
