import pool from '../lib/db';

async function deleteTestCancelledBookings() {
  try {
    // First, show what will be deleted
    const previewResult = await pool.query(`
      SELECT booking_id, invitee_name, booking_status, invitee_cancelled_at
      FROM bookings 
      WHERE booking_status = 'cancelled' 
        AND LOWER(invitee_name) IN ('rohnit', 'rohnit roy', 'meet', 'test booking')
      ORDER BY invitee_cancelled_at DESC
    `);
    
    console.log(`\n=== BOOKINGS TO BE DELETED ===`);
    console.log(`Total: ${previewResult.rows.length}\n`);
    console.table(previewResult.rows);
    
    // Delete the bookings
    const deleteResult = await pool.query(`
      DELETE FROM bookings 
      WHERE booking_status = 'cancelled' 
        AND LOWER(invitee_name) IN ('rohnit', 'rohnit roy', 'meet', 'test booking')
      RETURNING booking_id, invitee_name
    `);
    
    console.log(`\n=== DELETION COMPLETE ===`);
    console.log(`Deleted ${deleteResult.rowCount} cancelled bookings\n`);
    
    // Verify remaining cancelled bookings
    const remainingResult = await pool.query(`
      SELECT booking_id, invitee_name, booking_status
      FROM bookings 
      WHERE booking_status = 'cancelled'
    `);
    
    console.log(`\n=== REMAINING CANCELLED BOOKINGS ===`);
    console.log(`Total: ${remainingResult.rows.length}\n`);
    console.table(remainingResult.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

deleteTestCancelledBookings();
