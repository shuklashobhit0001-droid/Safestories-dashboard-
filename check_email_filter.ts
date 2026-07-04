import pool from './lib/db';

async function checkEmailFilter() {
  try {
    const result = await pool.query(`
      SELECT invitee_name, invitee_email, invitee_phone
      FROM bookings
      WHERE invitee_name IN ('Pragna', 'Nisha Jha', 'Pranoti Suranje')
      AND client_rating IS NOT NULL
    `);

    console.log('\n📧 EMAIL CHECK - WHY FILTERED OUT:\n');

    result.rows.forEach(row => {
      const email = row.invitee_email?.toLowerCase().trim();
      const phone = row.invitee_phone?.replace(/[\s\-\(\)\+]/g, '');

      const isValidEmail = email && email !== 'na' && email.includes('@');

      console.log(`${row.invitee_name}`);
      console.log(`  Email: "${email}"`);
      console.log(`  Phone: ${phone}`);
      console.log(`  Email valid: ${isValidEmail}`);
      console.log(`  Will be FILTERED: ${!phone || !isValidEmail ? '❌ YES' : '✅ NO'}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEmailFilter();
