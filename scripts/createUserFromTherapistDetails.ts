import pool from '../lib/db';

async function createUserFromTherapistDetails() {
  try {
    console.log('🔍 Checking therapist_details table...');
    
    // Get all therapist details that don't have a corresponding user account
    const therapistDetailsResult = await pool.query(`
      SELECT td.* 
      FROM therapist_details td
      LEFT JOIN users u ON LOWER(u.email) = LOWER(td.email)
      WHERE u.id IS NULL
      ORDER BY td.created_at DESC
    `);

    if (therapistDetailsResult.rows.length === 0) {
      console.log('✅ All therapist details already have user accounts');
      return;
    }

    console.log(`📋 Found ${therapistDetailsResult.rows.length} therapist(s) without user accounts:`);
    
    for (const therapist of therapistDetailsResult.rows) {
      console.log(`\n👤 Processing: ${therapist.name} (${therapist.email})`);
      console.log(`   ID: ${therapist.id}`);
      console.log(`   Phone: ${therapist.phone}`);
      console.log(`   Status: ${therapist.status}`);
      
      try {
        // Create user account
        const userResult = await pool.query(`
          INSERT INTO users (
            username, 
            password,
            name,
            email, 
            role, 
            full_name, 
            phone, 
            profile_picture_url, 
            created_at
          )
          VALUES ($1, $2, $3, $4, 'therapist', $5, $6, $7, NOW())
          RETURNING id, username, email, role
        `, [
          therapist.email,           // username = email
          therapist.password,        // password from therapist_details
          therapist.name,            // name (required field)
          therapist.email,           // email
          therapist.name,            // full_name
          therapist.phone,           // phone
          therapist.profile_picture_url  // profile_picture_url
        ]);

        const newUser = userResult.rows[0];
        console.log(`   ✅ User account created!`);
        console.log(`      User ID: ${newUser.id}`);
        console.log(`      Username: ${newUser.username}`);
        console.log(`      Role: ${newUser.role}`);
        console.log(`      Can now login with: ${newUser.email} + password`);
        
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`   ⚠️  User account already exists for ${therapist.email}`);
        } else {
          console.error(`   ❌ Error creating user for ${therapist.email}:`, error.message);
        }
      }
    }

    console.log('\n✅ User account creation complete!');
    console.log('\n📊 Summary:');
    
    // Show final count
    const finalCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM therapist_details td
      INNER JOIN users u ON LOWER(u.email) = LOWER(td.email)
      WHERE u.role = 'therapist'
    `);
    
    console.log(`   Total therapist_details with user accounts: ${finalCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createUserFromTherapistDetails();
