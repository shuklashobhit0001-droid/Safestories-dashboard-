import pool from '../lib/db';

async function createCaseHistoryTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_case_history (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255),
        client_name VARCHAR(255),
        booking_id VARCHAR(255),
        
        -- Socio-Demographic Details
        age VARCHAR(50),
        gender_identity TEXT,
        education TEXT,
        occupation TEXT,
        primary_income TEXT,
        marital_status VARCHAR(50),
        children TEXT,
        religion TEXT,
        socio_economic_status TEXT,
        city_state TEXT,
        
        -- Presenting Concerns
        presenting_concerns TEXT,
        duration_onset TEXT,
        triggers_factors TEXT,
        
        -- Biological & Daily Functioning
        sleep VARCHAR(50),
        appetite VARCHAR(50),
        energy_levels VARCHAR(50),
        weight_changes VARCHAR(50),
        libido TEXT,
        menstrual_history TEXT,
        
        -- Family & Personal History
        family_history TEXT,
        genogram_url TEXT,
        developmental_history TEXT,
        
        -- Medical & Mental Health History
        medical_history TEXT,
        medications TEXT,
        previous_mental_health TEXT,
        insight_level VARCHAR(100),
        
        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255),
        
        UNIQUE(client_id)
      );
    `);

    console.log('✅ client_case_history table created successfully');
  } catch (error) {
    console.error('❌ Error creating client_case_history table:', error);
  } finally {
    await pool.end();
  }
}

createCaseHistoryTable();
