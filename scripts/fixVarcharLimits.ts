import pool from '../lib/db';

async function fixVarcharLimits() {
  const client = await pool.connect();
  
  try {
    console.log('Dropping triggers...');
    await client.query(`DROP TRIGGER IF EXISTS trg_sync_refund_cancellation ON bookings;`);
    
    console.log('Altering VARCHAR(255) columns to TEXT...');
    
    await client.query(`
      -- Users table
      ALTER TABLE users 
        ALTER COLUMN username TYPE TEXT,
        ALTER COLUMN password TYPE TEXT,
        ALTER COLUMN name TYPE TEXT,
        ALTER COLUMN full_name TYPE TEXT;
      
      -- Therapists table
      ALTER TABLE therapists 
        ALTER COLUMN therapist_id TYPE TEXT,
        ALTER COLUMN name TYPE TEXT,
        ALTER COLUMN contact_info TYPE TEXT;
      
      -- Bookings table
      ALTER TABLE bookings 
        ALTER COLUMN refund_status TYPE TEXT,
        ALTER COLUMN emergency_contact_name TYPE TEXT,
        ALTER COLUMN therapist_id TYPE TEXT,
        ALTER COLUMN refund_id TYPE TEXT;
      
      -- Booking requests table
      ALTER TABLE booking_requests 
        ALTER COLUMN client_name TYPE TEXT,
        ALTER COLUMN client_email TYPE TEXT,
        ALTER COLUMN therapy_type TYPE TEXT,
        ALTER COLUMN therapist_name TYPE TEXT;
      
      -- Client additional notes
      ALTER TABLE client_additional_notes 
        ALTER COLUMN therapist_id TYPE TEXT,
        ALTER COLUMN therapist_name TYPE TEXT;
      
      -- Client transfer history
      ALTER TABLE client_transfer_history 
        ALTER COLUMN client_name TYPE TEXT,
        ALTER COLUMN client_email TYPE TEXT,
        ALTER COLUMN from_therapist_name TYPE TEXT,
        ALTER COLUMN to_therapist_name TYPE TEXT,
        ALTER COLUMN transferred_by_admin_name TYPE TEXT;
      
      -- Refund cancellation table
      ALTER TABLE refund_cancellation_table 
        ALTER COLUMN client_id TYPE TEXT,
        ALTER COLUMN client_name TYPE TEXT,
        ALTER COLUMN session_id TYPE TEXT,
        ALTER COLUMN session_name TYPE TEXT,
        ALTER COLUMN payment_id TYPE TEXT,
        ALTER COLUMN refund_id TYPE TEXT;
      
      -- Therapist clients summary
      ALTER TABLE therapist_clients_summary 
        ALTER COLUMN client_name TYPE TEXT,
        ALTER COLUMN client_email TYPE TEXT;
      
      -- Therapist appointments cache
      ALTER TABLE therapist_appointments_cache 
        ALTER COLUMN client_name TYPE TEXT;
      
      -- Therapist resources
      ALTER TABLE therapist_resources 
        ALTER COLUMN resource_name TYPE TEXT,
        ALTER COLUMN therapist_id TYPE TEXT,
        ALTER COLUMN therapist_name TYPE TEXT,
        ALTER COLUMN therapy_name TYPE TEXT;
      
      -- All clients table
      ALTER TABLE all_clients_table 
        ALTER COLUMN client_id TYPE TEXT,
        ALTER COLUMN client_name TYPE TEXT,
        ALTER COLUMN email_id TYPE TEXT,
        ALTER COLUMN therapist_id TYPE TEXT,
        ALTER COLUMN assigned_therapist TYPE TEXT;
      
      -- Appointment table
      ALTER TABLE appointment_table 
        ALTER COLUMN session_id TYPE TEXT,
        ALTER COLUMN session_name TYPE TEXT,
        ALTER COLUMN client_id TYPE TEXT,
        ALTER COLUMN client_name TYPE TEXT,
        ALTER COLUMN therapist_id TYPE TEXT,
        ALTER COLUMN therapist_name TYPE TEXT;
      
      -- Audit logs
      ALTER TABLE audit_logs 
        ALTER COLUMN therapist_name TYPE TEXT,
        ALTER COLUMN client_name TYPE TEXT,
        ALTER COLUMN timestamp TYPE TEXT;
      
      -- Notifications
      ALTER TABLE notifications 
        ALTER COLUMN title TYPE TEXT;
      
      -- Aisensy campaign
      ALTER TABLE aisensy_campaign_api 
        ALTER COLUMN campaign_name TYPE TEXT,
        ALTER COLUMN therapy TYPE TEXT,
        ALTER COLUMN therapist_name TYPE TEXT;
    `);
    
    console.log('✅ All VARCHAR(255) columns converted to TEXT');
    console.log('Note: Recreate trigger trg_sync_refund_cancellation if needed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixVarcharLimits();
