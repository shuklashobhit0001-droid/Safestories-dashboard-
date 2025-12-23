import pool from '../lib/db';

async function checkTherapistsTable() {
  try {
    console.log('Therapists table structure:');
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'therapists'
      ORDER BY ordinal_position
    `);
    console.log(structure.rows);

    console.log('\n\nAppointment_table structure:');
    const appointmentStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointment_table'
      ORDER BY ordinal_position
    `);
    console.log(appointmentStructure.rows);

    console.log('\n\nSample therapists data:');
    const data = await pool.query('SELECT * FROM therapists LIMIT 3');
    console.log(JSON.stringify(data.rows, null, 2));

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTherapistsTable();
