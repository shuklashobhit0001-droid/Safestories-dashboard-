import pool from '../lib/db';

async function createFreeConsultationNotesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS free_consultation_pretherapy_notes (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255),
        booking_id VARCHAR(255),
        session_date DATE,
        session_timing VARCHAR(100),
        session_duration VARCHAR(50),
        therapist_name VARCHAR(255),
        session_mode VARCHAR(50),
        
        -- 1. Presenting Concerns
        presenting_concerns TEXT,
        duration_onset TEXT,
        triggers_factors TEXT,
        
        -- 2. Overview
        therapy_overview_given BOOLEAN DEFAULT FALSE,
        client_questions TEXT,
        answers_given TEXT,
        
        -- 3. Next Steps
        preferred_languages TEXT,
        preferred_modes TEXT,
        preferred_price_range VARCHAR(100),
        preferred_time_slots TEXT,
        assigned_therapist_name VARCHAR(255),
        chatbot_booking_explained BOOLEAN DEFAULT FALSE,
        clinical_concerns_mentioned BOOLEAN DEFAULT FALSE,
        clinical_concerns_details TEXT,
        suicidal_thoughts_mentioned BOOLEAN DEFAULT FALSE,
        suicidal_thoughts_details TEXT,
        other_notes TEXT,
        
        -- Session Status
        session_status VARCHAR(50), -- Completed/Cancelled/No Show
        
        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
      );
    `);

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_free_consultation_client_name 
      ON free_consultation_pretherapy_notes(client_name);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_free_consultation_booking_id 
      ON free_consultation_pretherapy_notes(booking_id);
    `);

    console.log('✅ free_consultation_pretherapy_notes table created successfully');
  } catch (error) {
    console.error('❌ Error creating free_consultation_pretherapy_notes table:', error);
  } finally {
    await pool.end();
  }
}

createFreeConsultationNotesTable();
