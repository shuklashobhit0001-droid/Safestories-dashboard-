import pool from '../lib/db';

async function checkRefundsCount() {
  try {
    const result = await pool.query('SELECT COUNT(*) as total FROM refund_cancellation_table');
    console.log('Total entries in refund_cancellation_table:', result.rows[0].total);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRefundsCount();
