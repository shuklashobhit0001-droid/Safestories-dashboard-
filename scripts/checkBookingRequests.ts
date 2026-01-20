import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const result = await pool.query('SELECT * FROM booking_requests ORDER BY created_at DESC');
    console.log('Total records:', result.rows.length);
    console.log('\n' + JSON.stringify(result.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
