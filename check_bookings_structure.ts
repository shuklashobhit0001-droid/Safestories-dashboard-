import { Pool } from 'pg';

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false,
});

async function checkBookingsStructure() {
  try {
    console.log('🔍 Checking bookings table structure...\n');

    const bookingsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Bookings Table Columns:');
    if (bookingsStructure.rows.length > 0) {
      bookingsStructure.rows.forEach((row) => {
        console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    }

    // Check for invitee fields
    console.log('\n📊 Sample Booking Data (invitee fields):');
    const sampleBooking = await pool.query(`
      SELECT invitee_name, invitee_email, invitee_phone, 
             invitee_payment_amount, booking_status
      FROM bookings 
      LIMIT 1
    `);
    
    if (sampleBooking.rows.length > 0) {
      console.log(JSON.stringify(sampleBooking.rows[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkBookingsStructure();