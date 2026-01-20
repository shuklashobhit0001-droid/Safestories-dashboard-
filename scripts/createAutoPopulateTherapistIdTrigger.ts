import pool from '../lib/db.js';

async function createAutoPopulateTherapistIdTrigger() {
  console.log('=== CREATING AUTO-POPULATE THERAPIST_ID TRIGGER ===\n');

  try {
    // Create function
    console.log('1. Creating trigger function...');
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
    console.log('✓ Function created\n');

    // Drop existing trigger
    console.log('2. Removing old trigger if exists...');
    await pool.query('DROP TRIGGER IF EXISTS trg_auto_populate_therapist_id ON bookings;');
    console.log('✓ Old trigger removed\n');

    // Create trigger
    console.log('3. Creating new trigger...');
    await pool.query(`
      CREATE TRIGGER trg_auto_populate_therapist_id
      BEFORE INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION auto_populate_therapist_id();
    `);
    console.log('✓ Trigger created\n');

    console.log('=== SUCCESS ===');
    console.log('New bookings will automatically get therapist_id populated!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createAutoPopulateTherapistIdTrigger();
