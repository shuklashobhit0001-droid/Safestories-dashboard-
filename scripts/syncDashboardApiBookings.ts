import pool from '../lib/db';

async function syncDashboardApiBookings() {
  try {
    console.log('🔄 Starting dashboard API bookings sync...');

    // Get all entries with "waiting for payment" status
    const pendingBookings = await pool.query(
      `SELECT id, booking_id, created_at 
       FROM dashboard_api_booking 
       WHERE booking_status = 'waiting for payment'`
    );

    console.log(`📋 Found ${pendingBookings.rows.length} pending bookings`);

    await Promise.all(pendingBookings.rows.map(async (booking) => {
      const { id, booking_id, created_at } = booking;
      const now = new Date();
      const createdTime = new Date(created_at);
      const timeDiffMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);

      // Check if booking exists in bookings table
      const bookingExists = await pool.query(
        'SELECT booking_id, booking_status FROM bookings WHERE booking_id = $1',
        [booking_id]
      );

      if (bookingExists.rows.length > 0) {
        // Booking found - update to completed
        const bookingStatus = bookingExists.rows[0].booking_status;
        await pool.query(
          `UPDATE dashboard_api_booking 
           SET booking_status = $1, payment_status = 'Completed' 
           WHERE id = $2`,
          [bookingStatus, id]
        );
        console.log(`✅ Booking ${booking_id} marked as completed with status: ${bookingStatus}`);
      } else if (timeDiffMinutes > 30) {
        // 30 min passed and no booking - mark as failed
        await pool.query(
          `UPDATE dashboard_api_booking 
           SET booking_status = 'Failed', payment_status = 'Failed' 
           WHERE id = $1`,
          [id]
        );
        console.log(`❌ Booking ${booking_id} marked as failed (timeout)`);
      } else {
        console.log(`⏳ Booking ${booking_id} still pending (${Math.floor(timeDiffMinutes)} min elapsed)`);
      }
    }));

    console.log('✓ Sync completed successfully');
  } catch (error) {
    console.error('❌ Error syncing dashboard API bookings:', error);
  }
}

// Run immediately
syncDashboardApiBookings();

// Run every 2 minutes
setInterval(syncDashboardApiBookings, 2 * 60 * 1000);
