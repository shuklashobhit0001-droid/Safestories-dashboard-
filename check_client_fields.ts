import { Pool } from 'pg';

const pool = new Pool({
  host: '72.60.103.151',
  port: 5432,
  database: 'safestories_db',
  user: 'fluidadmin',
  password: 'admin123',
  ssl: false,
});

async function checkClientFields() {
  try {
    console.log('🔍 Checking clients table structure...\n');

    // Check clients table structure
    const clientsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'clients'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Clients Table Columns:');
    if (clientsStructure.rows.length > 0) {
      clientsStructure.rows.forEach((row) => {
        console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('   Table not found or no columns');
    }

    // Check bookings table for revenue calculation
    console.log('\n📋 Bookings Table Columns (for revenue):');
    const bookingsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      AND column_name LIKE '%price%' OR column_name LIKE '%amount%' OR column_name LIKE '%revenue%'
      ORDER BY ordinal_position
    `);
    
    if (bookingsStructure.rows.length > 0) {
      bookingsStructure.rows.forEach((row) => {
        console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('   No price/amount/revenue columns found');
    }

    // Sample client data
    console.log('\n📊 Sample Client Data:');
    const sampleClient = await pool.query(`
      SELECT * FROM clients LIMIT 1
    `);
    
    if (sampleClient.rows.length > 0) {
      console.log(JSON.stringify(sampleClient.rows[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkClientFields();