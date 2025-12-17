import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || '72.60.103.151',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'safestories_db',
  user: process.env.PGUSER || 'fluidadmin',
  password: process.env.PGPASSWORD || 'admin123',
});

export default pool;
