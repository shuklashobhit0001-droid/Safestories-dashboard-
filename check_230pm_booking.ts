import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
});

async function check() {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.invitee_name,
        b.booking_invitee_time,
        b.booking_status,
        CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_notes,
        csn.note_id
      FROM bookings b
      LEFT JOIN client_session_notes csn ON b.booking_id::text = csn.booking_id
      WHERE b.invitee_name LIKE '%Sanjana%'
        AND b.invitee_email = 'sjoshi1597@gmail.com'
        AND b.booking_invitee_time LIKE '%2:30 PM%'
    `);
    
    console.log('Bookings at 2:30 PM for Sanjana:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

check();
