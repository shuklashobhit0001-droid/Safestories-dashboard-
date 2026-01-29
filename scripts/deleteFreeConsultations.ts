import pool from '../lib/db';

async function deleteFreeConsultations() {
  try {
    // Preview what will be deleted
    const previewResult = await pool.query(`
      SELECT invitee_name, booking_resource_name, payment_amount, payment_status
      FROM dashboard_api_booking 
      WHERE payment_amount IS NULL OR payment_amount = 0
    `);
    
    console.log(`\n=== FREE CONSULTATIONS TO DELETE ===`);
    console.log(`Total: ${previewResult.rows.length}\n`);
    console.table(previewResult.rows);
    
    // Delete
    const deleteResult = await pool.query(`
      DELETE FROM dashboard_api_booking 
      WHERE payment_amount IS NULL OR payment_amount = 0
      RETURNING invitee_name, booking_resource_name
    `);
    
    console.log(`\n=== DELETED ${deleteResult.rowCount} RECORDS ===\n`);
    
    // Show remaining
    const remainingResult = await pool.query(`
      SELECT invitee_name, booking_resource_name, payment_amount, payment_status
      FROM dashboard_api_booking
    `);
    
    console.log(`\n=== REMAINING RECORDS ===`);
    console.log(`Total: ${remainingResult.rows.length}\n`);
    console.table(remainingResult.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

deleteFreeConsultations();
