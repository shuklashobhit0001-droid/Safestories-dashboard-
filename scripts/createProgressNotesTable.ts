import pool from '../lib/db';

async function createProgressNotesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_progress_notes (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255),
        client_name VARCHAR(255),
        booking_id VARCHAR(255),
        session_number INTEGER,
        session_date DATE,
        session_duration VARCHAR(50),
        session_mode VARCHAR(50),
        
        -- Subjective (Client Report)
        client_report TEXT,
        direct_quotes TEXT,
        
        -- Objective (Therapist Observation)
        client_presentation TEXT,
        presentation_tags TEXT[], -- Array of tags like 'Anxious', 'Tearful', etc.
        
        -- Interventions
        techniques_used TEXT,
        homework_assigned TEXT,
        
        -- Client Response
        client_reaction TEXT,
        reaction_tags TEXT[], -- Array like 'Engaged', 'Reflective', etc.
        engagement_notes TEXT,
        
        -- Assessment (Clinical Impressions)
        themes_patterns TEXT,
        progress_regression TEXT,
        clinical_concerns TEXT,
        
        -- Risk Assessment
        self_harm_mention BOOLEAN DEFAULT FALSE,
        self_harm_details TEXT,
        risk_level VARCHAR(50), -- None/Low/Moderate/High
        risk_factors TEXT,
        protective_factors TEXT,
        safety_plan TEXT,
        
        -- Plan
        future_interventions TEXT,
        session_frequency VARCHAR(50),
        
        -- Therapist Declaration
        therapist_name VARCHAR(255),
        therapist_signature TEXT,
        signature_date DATE,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
      );
    `);

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_progress_notes_client_id 
      ON client_progress_notes(client_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_progress_notes_session_date 
      ON client_progress_notes(session_date DESC);
    `);

    console.log('✅ client_progress_notes table created successfully');
  } catch (error) {
    console.error('❌ Error creating client_progress_notes table:', error);
  } finally {
    await pool.end();
  }
}

createProgressNotesTable();
