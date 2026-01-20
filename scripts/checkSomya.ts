import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const result = await pool.query("SELECT invitee_name, invitee_phone FROM bookings WHERE invitee_name ILIKE '%Somya%'");
    console.log('Bookings with Somya:', result.rows.length);
    result.rows.forEach(row => {
      console.log('Name:', row.invitee_name, '| Phone:', row.invitee_phone);
    });
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
