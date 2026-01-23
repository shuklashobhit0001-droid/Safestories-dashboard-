import pool from '../lib/db';

async function verifyCompleteSchema() {
  try {
    console.log('=== DATABASE SCHEMA VERIFICATION ===\n');

    // 1. Get all tables
    console.log('1. ALL TABLES IN DATABASE:\n');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log(`Total tables: ${tables.rows.length}`);
    tables.rows.forEach((row, i) => console.log(`${i + 1}. ${row.table_name}`));
    console.log('\n');

    // 2. Get all foreign keys
    console.log('2. ALL FOREIGN KEY RELATIONSHIPS:\n');
    const fks = await pool.query(`
      SELECT
        tc.table_name as child_table,
        kcu.column_name as child_column,
        ccu.table_name AS parent_table,
        ccu.column_name AS parent_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `);
    console.log(`Total foreign keys: ${fks.rows.length}\n`);
    fks.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.child_table}.${row.child_column} → ${row.parent_table}.${row.parent_column}`);
    });
    console.log('\n');

    // 3. Compare with schema document
    const schemaFKs = [
      'users.therapist_id → therapists.therapist_id',
      'bookings.therapist_id → therapists.therapist_id',
      'therapist_dashboard_stats.therapist_id → therapists.therapist_id',
      'therapist_clients_summary.therapist_id → therapists.therapist_id',
      'therapist_appointments_cache.therapist_id → therapists.therapist_id',
      'therapist_resources.therapist_id → therapists.therapist_id',
      'all_clients_table.therapist_id → therapists.therapist_id',
      'appointment_table.therapist_id → therapists.therapist_id',
      'client_transfer_history.from_therapist_id → therapists.therapist_id',
      'client_transfer_history.to_therapist_id → therapists.therapist_id',
      'client_additional_notes.booking_id → bookings.booking_id',
      'client_additional_notes.therapist_id → therapists.therapist_id',
      'client_session_notes.booking_id → bookings.booking_id',
      'payments.booking_id → bookings.booking_id',
      'refund_cancellation_table.session_id → bookings.booking_id',
      'booking_cancelled.booking_id → bookings.booking_id',
      'audit_logs.therapist_id → therapists.therapist_id',
      'client_doc_form.booking_id → bookings.booking_id',
      'notifications.user_id → users.id'
    ];

    console.log('3. SCHEMA DOCUMENT vs DATABASE COMPARISON:\n');
    console.log(`Schema document lists: ${schemaFKs.length} relationships`);
    console.log(`Database has: ${fks.rows.length} foreign keys\n`);

    const dbFKs = fks.rows.map(row => 
      `${row.child_table}.${row.child_column} → ${row.parent_table}.${row.parent_column}`
    );

    console.log('Missing in database:');
    schemaFKs.forEach(fk => {
      if (!dbFKs.includes(fk)) {
        console.log(`  ❌ ${fk}`);
      }
    });

    console.log('\nExtra in database (not in schema doc):');
    dbFKs.forEach(fk => {
      if (!schemaFKs.includes(fk)) {
        console.log(`  ⚠️  ${fk}`);
      }
    });

    console.log('\n');

    // 4. Tables without foreign keys
    console.log('4. TABLES WITHOUT FOREIGN KEY RELATIONSHIPS:\n');
    const tablesWithFK = [...new Set(fks.rows.map(r => r.child_table))];
    const tablesWithoutFK = tables.rows
      .map(r => r.table_name)
      .filter(t => !tablesWithFK.includes(t));
    
    console.log(`Total: ${tablesWithoutFK.length}`);
    tablesWithoutFK.forEach(t => console.log(`  - ${t}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

verifyCompleteSchema();
