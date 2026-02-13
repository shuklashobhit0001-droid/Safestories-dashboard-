import pool from './lib/db';

async function checkShaurySessionType() {
  try {
    const clientPhone = '+91 9272109799';
    
    console.log('=== CHECKING SHAURY KHANT SESSION TYPE (NEW LOGIC) ===\n');
    
    // 1. Check bookings
    console.log('1. All Bookings:');
    const bookings = await pool.query(
      `SELECT booking_id, booking_resource_name, booking_start_at, booking_status
       FROM bookings 
       WHERE invitee_phone = $1
       ORDER BY booking_start_at DESC`,
      [clientPhone]
    );
    console.log(`Total bookings: ${bookings.rows.length}`);
    bookings.rows.forEach((b, i) => {
      console.log(`  ${i+1}. ${b.booking_resource_name} - ${b.booking_start_at} - ${b.booking_status}`);
    });
    console.log('');
    
    // 2. Check PAID bookings (NEW LOGIC)
    console.log('2. Paid Session Bookings (NOT free consultation):');
    const paidBookings = await pool.query(
      `SELECT booking_id, booking_resource_name FROM bookings 
       WHERE invitee_phone = $1 
       AND booking_resource_name NOT ILIKE '%free consultation%'`,
      [clientPhone]
    );
    console.log(`Paid bookings count: ${paidBookings.rows.length}`);
    if (paidBookings.rows.length > 0) {
      paidBookings.rows.forEach((b, i) => {
        console.log(`  ${i+1}. ${b.booking_resource_name}`);
      });
    }
    console.log('');
    
    // 3. Check free consultation bookings
    console.log('3. Free Consultation Bookings:');
    const freeConsultBooking = await pool.query(
      `SELECT booking_id, booking_resource_name FROM bookings 
       WHERE invitee_phone = $1 
       AND booking_resource_name ILIKE '%free consultation%'`,
      [clientPhone]
    );
    console.log(`Free consultation bookings: ${freeConsultBooking.rows.length}`);
    if (freeConsultBooking.rows.length > 0) {
      freeConsultBooking.rows.forEach((b, i) => {
        console.log(`  ${i+1}. ${b.booking_resource_name}`);
      });
    }
    console.log('');
    
    // 4. NEW API logic result
    console.log('4. NEW API Logic Result:');
    const hasPaidSessions = paidBookings.rows.length > 0;
    const hasFreeConsultation = freeConsultBooking.rows.length > 0;
    
    console.log(`hasPaidSessions: ${hasPaidSessions}`);
    console.log(`hasFreeConsultation: ${hasFreeConsultation}`);
    console.log('');
    
    console.log('=== CONCLUSION ===');
    if (hasPaidSessions) {
      console.log('✅ WILL SHOW: All 4 tabs (Overview, Case History, Progress Notes, Goal Tracking)');
      console.log('   Reason: Client has paid session bookings');
    } else if (!hasPaidSessions && hasFreeConsultation) {
      console.log('✅ WILL SHOW: 2 tabs (Overview, Pre-therapy Notes)');
      console.log('   Reason: Client has ONLY free consultation bookings');
    } else {
      console.log('⚠️  No bookings found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkShaurySessionType();
