import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123'
});

async function findTherapist() {
  try {
    const name = 'Aastha Yagnik';
    console.log(`Searching for therapist: ${name}`);

    const userResult = await pool.query(
      `SELECT id, name, full_name, role, therapist_id FROM users WHERE name ILIKE $1 OR full_name ILIKE $1`,
      [`%Aastha%`]
    );
    console.log('\n--- USERS MATCHES ---');
    console.table(userResult.rows);

    const therapistResult = await pool.query(
      `SELECT * FROM therapists WHERE name ILIKE $1`,
      [`%Aastha%`]
    );
    console.log('\n--- THERAPISTS MATCHES ---');
    console.table(therapistResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

findTherapist();
