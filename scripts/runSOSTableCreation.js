import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false
});

async function createSOSTable() {
  try {
    console.log('Creating sos_risk_assessments table...');
    
    const sqlFile = path.join(__dirname, 'createSOSTable.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await pool.query(sql);
    console.log('✅ sos_risk_assessments table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createSOSTable();