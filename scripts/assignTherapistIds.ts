import pool from '../lib/db';

// Function to generate unique therapist ID
function generateTherapistId(name: string): string {
  // Take first name, convert to lowercase, remove spaces
  const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  // Add random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${firstName}${randomNum}`;
}

async function assignTherapistIds() {
  try {
    console.log('🔍 Finding users without therapist_id...');
    
    // Get all therapist users without therapist_id
    const usersResult = await pool.query(`
      SELECT id, username, email, name, role
      FROM users
      WHERE role = 'therapist' AND therapist_id IS NULL
      ORDER BY id
    `);

    if (usersResult.rows.length === 0) {
      console.log('✅ All therapist users already have therapist_id assigned');
      return;
    }

    console.log(`📋 Found ${usersResult.rows.length} therapist(s) without therapist_id:\n`);
    
    for (const user of usersResult.rows) {
      console.log(`👤 Processing: ${user.name} (${user.email})`);
      console.log(`   User ID: ${user.id}`);
      
      // Generate unique therapist_id
      let therapistId = generateTherapistId(user.name);
      let attempts = 0;
      const maxAttempts = 10;
      
      // Ensure uniqueness
      while (attempts < maxAttempts) {
        const existingResult = await pool.query(
          'SELECT therapist_id FROM users WHERE therapist_id = $1',
          [therapistId]
        );
        
        if (existingResult.rows.length === 0) {
          break; // ID is unique
        }
        
        // Generate new ID
        therapistId = generateTherapistId(user.name);
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        console.log(`   ❌ Failed to generate unique therapist_id after ${maxAttempts} attempts`);
        continue;
      }
      
      // First, create entry in therapists table
      try {
        // Get therapist details from therapist_details table
        const detailsResult = await pool.query(
          'SELECT * FROM therapist_details WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1',
          [user.email]
        );
        
        if (detailsResult.rows.length > 0) {
          const details = detailsResult.rows[0];
          
          // Insert into therapists table
          await pool.query(`
            INSERT INTO therapists (
              therapist_id, name, contact_info, phone_number, 
              specialization, specialization_details,
              qualification_pdf_url, profile_picture_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            therapistId,
            details.name,
            details.email,
            details.phone,
            details.specializations,
            details.specialization_details,
            details.qualification_pdf_url,
            details.profile_picture_url
          ]);
          
          console.log(`   ✅ Created therapist entry: ${therapistId}`);
        } else {
          console.log(`   ⚠️  No therapist_details found for ${user.email}`);
        }
      } catch (therapistError: any) {
        console.log(`   ⚠️  Error creating therapist entry: ${therapistError.message}`);
      }
      
      // Update user with therapist_id
      await pool.query(
        'UPDATE users SET therapist_id = $1 WHERE id = $2',
        [therapistId, user.id]
      );
      
      console.log(`   ✅ Assigned therapist_id to user: ${therapistId}\n`);
    }

    console.log('✅ Therapist ID assignment complete!\n');
    console.log('📊 Summary:');
    
    // Show final results
    const finalResult = await pool.query(`
      SELECT id, username, name, therapist_id
      FROM users
      WHERE role = 'therapist'
      ORDER BY id
    `);
    
    console.table(finalResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

assignTherapistIds();
