import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const result = await pool.query(
      'DELETE FROM refund_cancellation_table WHERE id IN (20, 21, 22, 23) RETURNING *'
    );
    console.log('Deleted records:', result.rowCount);
    console.log(JSON.stringify(result.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
