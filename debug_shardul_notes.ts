import pool from './api/lib/db.js';

async function debugShardulNotes() {
  try {
    console.log('🔍 Debugging Shardul Ghatpande notes...\n');
    
    // 1. Check session notes for Shardul
    const sessionNotes = await pool.query(`
      SELECT note_id, client_name, booking_id, session_timing
      FROM client_session_notes
      WHERE client_name ILIKE '%Shardul%'
    `);
    
    console.log(`📊 Session notes for Shardul: ${sessionNotes.rows.length}`);
    sessionNotes.rows.forEach(note => {
      console.log(`  - Note ID: ${note.note_id}, Booking: ${note.booking_id}`);
      console.log(`    Client Name: "${note.client_name}"`);
      console.log(`    Session: ${note.session_timing}\n`);
    });
    
    // 2. Check bookings for Shardul
    const bookings = await pool.query(`
      SELECT booking_id, invitee_name, invitee_email, invitee_phone
      FROM bookings
      WHERE invitee_name ILIKE '%Shardul%'
      LIMIT 3
    `);
    
    console.log(`\n📅 Bookings for Shardul: ${bookings.rows.length}`);
    bookings.rows.forEach(booking => {
      console.log(`  - Booking ID: ${booking.booking_id}`);
      console.log(`    Name: ${booking.invitee_name}`);
      console.log(`    Email: ${booking.invitee_email}`);
      console.log(`    Phone: ${booking.invitee_phone}\n`);
    });
    
    // 3. Test the API query
    if (bookings.rows.length > 0) {
      const testEmail = bookings.rows[0].invitee_email;
      const testPhone = bookings.rows[0].invitee_phone;
      
      console.log(`\n🧪 Testing API query with:`);
      console.log(`   Email: ${testEmail}`);
      console.log(`   Phone: ${testPhone}\n`);
      
      const testResult = await pool.query(`
        SELECT DISTINCT csn.note_id as id, csn.client_name, csn.booking_id
        FROM client_session_notes csn
        LEFT JOIN bookings b ON csn.booking_id::text = b.booking_id::text
        WHERE csn.client_name ILIKE $1 
           OR b.invitee_email = $2
           OR b.invitee_phone = ANY($3)
      `, ['%Shardul%', testEmail, [testPhone]]);
      
      console.log(`✅ Query returned ${testResult.rows.length} notes`);
      testResult.rows.forEach(note => {
        console.log(`  - Note ID: ${note.id}, Client: ${note.client_name}, Booking: ${note.booking_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugShardulNotes();
