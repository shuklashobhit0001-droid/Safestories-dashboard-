import pool from './lib/db.ts';

async function research() {
  try {
    // 1. Check distinct subjects to find consultations
    console.log('--- Unique Booking Subjects ---');
    const subjects = await pool.query("SELECT DISTINCT booking_subject FROM bookings");
    console.table(subjects.rows);

    // 2. Check client_doc_form structure again to see if there's a type field
    console.log('\n--- client_doc_form Schema ---');
    const schema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'client_doc_form'
    `);
    console.table(schema.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

research();
