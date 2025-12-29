import pool from '../lib/db';

async function createTherapistDashboardTables() {
  try {
    console.log('Creating therapist dashboard tables...');

    // 1. Create therapist_dashboard_stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapist_dashboard_stats (
        id SERIAL PRIMARY KEY,
        therapist_id VARCHAR(50) NOT NULL,
        total_sessions INTEGER DEFAULT 0,
        confirmed_sessions INTEGER DEFAULT 0,
        cancelled_sessions INTEGER DEFAULT 0,
        no_shows INTEGER DEFAULT 0,
        upcoming_bookings INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        UNIQUE(therapist_id)
      );
    `);
    console.log('✓ Created therapist_dashboard_stats table');

    // 2. Create therapist_clients_summary table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapist_clients_summary (
        id SERIAL PRIMARY KEY,
        therapist_id VARCHAR(50) NOT NULL,
        client_name VARCHAR(255),
        client_email VARCHAR(255),
        client_phone VARCHAR(50),
        total_sessions INTEGER DEFAULT 0,
        last_session_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created therapist_clients_summary table');

    // 3. Create therapist_appointments_cache table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS therapist_appointments_cache (
        id SERIAL PRIMARY KEY,
        therapist_id VARCHAR(50) NOT NULL,
        session_timings VARCHAR(500),
        session_name VARCHAR(500),
        client_name VARCHAR(255),
        contact_info VARCHAR(100),
        mode VARCHAR(100),
        booking_date TIMESTAMP,
        booking_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created therapist_appointments_cache table');

    console.log('\n✅ All therapist dashboard tables created successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTherapistDashboardTables();