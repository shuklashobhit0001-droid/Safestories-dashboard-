import pool from '../lib/db';

async function fixTimestamps() {
  const client = await pool.connect();
  
  try {
    console.log('=== FIXING BOOKING TIMESTAMPS ===\n');

    // First, check current data
    console.log('📊 BEFORE FIX - Sample data:');
    const before = await client.query(`
      SELECT booking_id, invitee_name, booking_invitee_time, booking_start_at, booking_end_at
      FROM bookings
      ORDER BY booking_id DESC
      LIMIT 5
    `);
    
    before.rows.forEach(row => {
      console.log(`\n${row.invitee_name}:`);
      console.log(`  booking_invitee_time: ${row.booking_invitee_time}`);
      console.log(`  booking_start_at: ${row.booking_start_at}`);
      console.log(`  booking_end_at: ${row.booking_end_at}`);
    });

    console.log('\n\n⚠️  READY TO FIX ALL TIMESTAMPS');
    console.log('This will add 5.5 hours to all booking_start_at and booking_end_at timestamps\n');

    // Count total bookings
    const count = await client.query('SELECT COUNT(*) FROM bookings');
    console.log(`Total bookings to update: ${count.rows[0].count}\n`);

    // Update timestamps
    console.log('🔄 Updating timestamps...');
    
    await client.query(`
      UPDATE bookings
      SET 
        booking_start_at = booking_start_at + INTERVAL '5 hours 30 minutes',
        booking_end_at = booking_end_at + INTERVAL '5 hours 30 minutes'
    `);

    console.log('✅ Timestamps updated!\n');

    // Check after fix
    console.log('📊 AFTER FIX - Sample data:');
    const after = await client.query(`
      SELECT booking_id, invitee_name, booking_invitee_time, booking_start_at, booking_end_at
      FROM bookings
      ORDER BY booking_id DESC
      LIMIT 5
    `);
    
    after.rows.forEach(row => {
      console.log(`\n${row.invitee_name}:`);
      console.log(`  booking_invitee_time: ${row.booking_invitee_time}`);
      console.log(`  booking_start_at: ${row.booking_start_at}`);
      console.log(`  booking_end_at: ${row.booking_end_at}`);
    });

    console.log('\n\n✅ ALL TIMESTAMPS FIXED!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTimestamps();
