import pool from '../lib/db.js';

async function createReportIssuesTable() {
  try {
    console.log('Creating report_issues table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_issues (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        component TEXT NOT NULL,
        description TEXT NOT NULL,
        screenshot_url TEXT,
        reported_by TEXT NOT NULL,
        user_role TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        notes TEXT
      )
    `);
    
    console.log('✓ report_issues table created successfully');
    
    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_report_issues_status ON report_issues(status);
      CREATE INDEX IF NOT EXISTS idx_report_issues_created_at ON report_issues(created_at DESC);
    `);
    
    console.log('✓ Indexes created successfully');
    
  } catch (error) {
    console.error('Error creating report_issues table:', error);
  } finally {
    await pool.end();
  }
}

createReportIssuesTable();
