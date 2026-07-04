import pool from './lib/db';
import * as fs from 'fs';
import * as path from 'path';

async function applyTriggerFix() {
  try {
    console.log('🔧 Applying trigger fix...\n');

    // Read the production-setup.sql file
    const sqlPath = '/Users/rohnitroy/Downloads/Safestories-dashboard-/scripts/production-setup.sql';
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Extract the function definition (everything from CREATE OR REPLACE FUNCTION until $$ LANGUAGE plpgsql;)
    const functionMatch = sql.match(/CREATE OR REPLACE FUNCTION notify_on_booking\(\)[\s\S]*?\$\$ LANGUAGE plpgsql;/);
    if (!functionMatch) {
      throw new Error('Could not find notify_on_booking function in SQL file');
    }

    const functionSQL = functionMatch[0];

    // Execute the function creation
    await pool.query(functionSQL);
    console.log('✅ Trigger function updated successfully');

    // Verify trigger exists
    const triggerCheck = await pool.query(`
      SELECT trigger_name FROM information_schema.triggers
      WHERE trigger_name = 'notify_on_booking_trigger'
      LIMIT 1
    `);

    if (triggerCheck.rows.length === 0) {
      console.log('⚠️  Creating trigger since it doesn\'t exist...');
      await pool.query(`
        CREATE TRIGGER notify_on_booking_trigger
        AFTER INSERT OR UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION notify_on_booking();
      `);
      console.log('✅ Trigger created');
    } else {
      console.log('✅ Trigger already exists');
    }

    console.log('\n🎉 Trigger fix applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying trigger fix:', error);
    process.exit(1);
  }
}

applyTriggerFix();
