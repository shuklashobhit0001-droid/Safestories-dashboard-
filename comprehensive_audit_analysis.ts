import pool from './lib/db';

async function comprehensiveAudit() {
  console.log('🔍 COMPREHENSIVE APPLICATION AUDIT');
  console.log('====================================================================================================\n');

  try {
    // 1. Check database schema consistency
    console.log('1️⃣ DATABASE SCHEMA CHECK');
    console.log('====================================================================================================');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Total Tables: ${tables.rows.length}`);
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // 2. Check for missing indexes
    console.log('\n2️⃣ CRITICAL COLUMNS INDEX CHECK');
    console.log('====================================================================================================');
    
    const indexes = await pool.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    console.log(`Total Indexes: ${indexes.rows.length}`);
    
    // 3. Check bookings table structure
    console.log('\n3️⃣ BOOKINGS TABLE STRUCTURE');
    console.log('====================================================================================================');
    
    const bookingsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    bookingsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 4. Check for NULL values in critical fields
    console.log('\n4️⃣ DATA QUALITY CHECK');
    console.log('====================================================================================================');
    
    const nullChecks = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN invitee_name IS NULL THEN 1 END) as null_names,
        COUNT(CASE WHEN invitee_email IS NULL THEN 1 END) as null_emails,
        COUNT(CASE WHEN invitee_phone IS NULL THEN 1 END) as null_phones,
        COUNT(CASE WHEN booking_host_name IS NULL THEN 1 END) as null_therapists,
        COUNT(CASE WHEN booking_mode IS NULL THEN 1 END) as null_modes,
        COUNT(CASE WHEN booking_status IS NULL THEN 1 END) as null_status
      FROM bookings
    `);
    
    const nullData = nullChecks.rows[0];
    console.log(`Total Bookings: ${nullData.total_bookings}`);
    console.log(`NULL Names: ${nullData.null_names}`);
    console.log(`NULL Emails: ${nullData.null_emails}`);
    console.log(`NULL Phones: ${nullData.null_phones}`);
    console.log(`NULL Therapists: ${nullData.null_therapists}`);
    console.log(`NULL Modes: ${nullData.null_modes}`);
    console.log(`NULL Status: ${nullData.null_status}`);
    
    // 5. Check for duplicate clients
    console.log('\n5️⃣ DUPLICATE CLIENTS CHECK');
    console.log('====================================================================================================');
    
    const duplicates = await pool.query(`
      SELECT 
        invitee_email,
        COUNT(*) as count
      FROM bookings
      WHERE invitee_email IS NOT NULL
      GROUP BY invitee_email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `);
    
    console.log(`Clients with multiple bookings (top 10):`);
    duplicates.rows.forEach(row => {
      console.log(`  - ${row.invitee_email}: ${row.count} bookings`);
    });
    
    // 6. Check therapist consistency
    console.log('\n6️⃣ THERAPIST NAME CONSISTENCY');
    console.log('====================================================================================================');
    
    const therapistNames = await pool.query(`
      SELECT DISTINCT booking_host_name, COUNT(*) as booking_count
      FROM bookings
      WHERE booking_host_name IS NOT NULL
      GROUP BY booking_host_name
      ORDER BY booking_count DESC
    `);
    
    console.log('Therapist Names in Bookings:');
    therapistNames.rows.forEach(row => {
      console.log(`  - ${row.booking_host_name}: ${row.booking_count} bookings`);
    });
    
    // 7. Check session notes coverage
    console.log('\n7️⃣ SESSION NOTES COVERAGE');
    console.log('====================================================================================================');
    
    const notesCoverage = await pool.query(`
      SELECT 
        COUNT(*) as total_past_sessions,
        COUNT(csn.note_id) + COUNT(cpn.id) + COUNT(fcn.id) as sessions_with_notes,
        COUNT(*) - (COUNT(csn.note_id) + COUNT(cpn.id) + COUNT(fcn.id)) as sessions_without_notes
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
      LEFT JOIN client_progress_notes cpn ON b.booking_id = cpn.booking_id
      LEFT JOIN free_consultation_pretherapy_notes fcn ON b.booking_id = fcn.booking_id
      WHERE b.booking_start_at < NOW()
        AND b.booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
    `);
    
    const notes = notesCoverage.rows[0];
    console.log(`Total Past Sessions: ${notes.total_past_sessions}`);
    console.log(`Sessions with Notes: ${notes.sessions_with_notes}`);
    console.log(`Sessions without Notes: ${notes.sessions_without_notes}`);
    console.log(`Coverage: ${((notes.sessions_with_notes / notes.total_past_sessions) * 100).toFixed(2)}%`);
    
    // 8. Check booking status distribution
    console.log('\n8️⃣ BOOKING STATUS DISTRIBUTION');
    console.log('====================================================================================================');
    
    const statusDist = await pool.query(`
      SELECT 
        booking_status,
        COUNT(*) as count
      FROM bookings
      GROUP BY booking_status
      ORDER BY count DESC
    `);
    
    console.log('Status Distribution:');
    statusDist.rows.forEach(row => {
      console.log(`  - ${row.booking_status || 'NULL'}: ${row.count}`);
    });
    
    // 9. Check mode distribution
    console.log('\n9️⃣ BOOKING MODE DISTRIBUTION');
    console.log('====================================================================================================');
    
    const modeDist = await pool.query(`
      SELECT 
        booking_mode,
        COUNT(*) as count
      FROM bookings
      GROUP BY booking_mode
      ORDER BY count DESC
    `);
    
    console.log('Mode Distribution:');
    modeDist.rows.forEach(row => {
      console.log(`  - ${row.booking_mode || 'NULL'}: ${row.count}`);
    });
    
    // 10. Check for orphaned records
    console.log('\n🔟 ORPHANED RECORDS CHECK');
    console.log('====================================================================================================');
    
    const orphanedNotes = await pool.query(`
      SELECT COUNT(*) as count
      FROM client_session_notes csn
      LEFT JOIN bookings b ON csn.booking_id = b.booking_id
      WHERE b.booking_id IS NULL
    `);
    
    console.log(`Orphaned Session Notes: ${orphanedNotes.rows[0].count}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

comprehensiveAudit();
