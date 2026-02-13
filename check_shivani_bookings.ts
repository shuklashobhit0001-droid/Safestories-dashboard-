import pool from './lib/db';

async function checkShivaniBookings() {
  try {
    console.log('🔍 Checking Shivani\'s booking history...\n');

    // Get all bookings for Shivani
    const result = await pool.query(`
      SELECT 
        booking_id,
        invitee_name,
        invitee_email,
        invitee_phone,
        booking_host_name,
        booking_resource_name,
        booking_start_at,
        booking_status,
        booking_invitee_time,
        invitee_created_at
      FROM bookings
      WHERE invitee_email = 'shivanichandlani1998@gmail.com'
         OR invitee_phone = '+91 9314592142'
      ORDER BY booking_start_at DESC
    `);

    console.log(`📊 Total bookings found: ${result.rows.length}\n`);

    if (result.rows.length === 0) {
      console.log('❌ No bookings found for Shivani');
      await pool.end();
      return;
    }

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log(`📅 30 days ago: ${thirtyDaysAgo.toISOString().split('T')[0]}\n`);

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('ALL BOOKINGS FOR SHIVANI');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    result.rows.forEach((booking, index) => {
      const bookingDate = new Date(booking.booking_start_at);
      const isRecent = bookingDate >= thirtyDaysAgo;
      const isNotCancelled = booking.booking_status !== 'cancelled' && booking.booking_status !== 'canceled';
      
      console.log(`${index + 1}. Booking ID: ${booking.booking_id}`);
      console.log(`   Client Name: ${booking.invitee_name}`);
      console.log(`   Email: ${booking.invitee_email}`);
      console.log(`   Phone: ${booking.invitee_phone}`);
      console.log(`   Therapist: ${booking.booking_host_name}`);
      console.log(`   Session: ${booking.booking_resource_name}`);
      console.log(`   Date: ${booking.booking_start_at}`);
      console.log(`   Status: ${booking.booking_status || 'confirmed'}`);
      console.log(`   Invitee Time: ${booking.booking_invitee_time}`);
      console.log(`   Created At: ${booking.invitee_created_at}`);
      console.log(`   ⏰ Is within last 30 days? ${isRecent ? '✅ YES' : '❌ NO'}`);
      console.log(`   📋 Is not cancelled? ${isNotCancelled ? '✅ YES' : '❌ NO'}`);
      console.log(`   🎯 Should count as ACTIVE? ${isRecent && isNotCancelled ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });

    // Count active sessions
    const activeSessions = result.rows.filter(booking => {
      const bookingDate = new Date(booking.booking_start_at);
      const isRecent = bookingDate >= thirtyDaysAgo;
      const isNotCancelled = booking.booking_status !== 'cancelled' && booking.booking_status !== 'canceled';
      return isRecent && isNotCancelled;
    });

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(`Total Bookings: ${result.rows.length}`);
    console.log(`Active Sessions (last 30 days, not cancelled): ${activeSessions.length}`);
    console.log(`Expected Status: ${activeSessions.length > 0 ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkShivaniBookings();
