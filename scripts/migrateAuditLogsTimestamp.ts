import pool from '../lib/db.js';

async function migrateAuditLogsTimestamp() {
  try {
    // Add new column for formatted timestamp
    await pool.query(`
      ALTER TABLE audit_logs 
      ADD COLUMN IF NOT EXISTS timestamp_ist VARCHAR(255)
    `);
    
    console.log('✓ Added timestamp_ist column');
    
    // Convert existing timestamps to IST format
    const result = await pool.query('SELECT log_id, timestamp FROM audit_logs WHERE timestamp IS NOT NULL');
    
    for (const row of result.rows) {
      const date = new Date(row.timestamp);
      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      const formattedIST = istDate.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' IST';
      
      await pool.query(
        'UPDATE audit_logs SET timestamp_ist = $1 WHERE log_id = $2',
        [formattedIST, row.log_id]
      );
    }
    
    console.log(`✓ Converted ${result.rows.length} timestamps to IST format`);
    
    // Drop old timestamp column
    await pool.query('ALTER TABLE audit_logs DROP COLUMN IF EXISTS timestamp');
    console.log('✓ Dropped old timestamp column');
    
    // Rename new column to timestamp
    await pool.query('ALTER TABLE audit_logs RENAME COLUMN timestamp_ist TO timestamp');
    console.log('✓ Renamed timestamp_ist to timestamp');
    
    console.log('✓ Migration completed successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrateAuditLogsTimestamp();
