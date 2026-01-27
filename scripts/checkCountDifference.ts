import pool from '../lib/db';

(async () => {
  const r1 = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')`);
  const r2 = await pool.query(`SELECT COUNT(invitee_created_at) as total FROM bookings WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')`);
  const r3 = await pool.query(`SELECT COUNT(*) as total FROM bookings WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show') AND invitee_created_at IS NULL`);
  
  console.log('COUNT(*):', r1.rows[0].total);
  console.log('COUNT(invitee_created_at):', r2.rows[0].total);
  console.log('NULL invitee_created_at:', r3.rows[0].total);
  console.log('\nDifference:', Number(r1.rows[0].total) - Number(r2.rows[0].total));
  
  await pool.end();
})();
