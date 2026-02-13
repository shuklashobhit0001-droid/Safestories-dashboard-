import pool from '../lib/db';

async function createTherapyGoalsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_therapy_goals (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255),
        client_name VARCHAR(255),
        goal_description TEXT NOT NULL,
        current_stage VARCHAR(50) DEFAULT 'Initiation', -- Initiation/In-progress/Maintenance/Review
        
        -- Stage timestamps
        initiation_date DATE,
        in_progress_date DATE,
        maintenance_date DATE,
        review_date DATE,
        
        -- Status
        is_active BOOLEAN DEFAULT TRUE,
        is_achieved BOOLEAN DEFAULT FALSE,
        achieved_date DATE,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(255)
      );
    `);

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_therapy_goals_client_id 
      ON client_therapy_goals(client_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_therapy_goals_active 
      ON client_therapy_goals(is_active) WHERE is_active = TRUE;
    `);

    console.log('✅ client_therapy_goals table created successfully');
  } catch (error) {
    console.error('❌ Error creating client_therapy_goals table:', error);
  } finally {
    await pool.end();
  }
}

createTherapyGoalsTable();
