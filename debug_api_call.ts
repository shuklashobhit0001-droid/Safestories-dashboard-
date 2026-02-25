import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function debugAPICall() {
  const client_id = "Shardul Ghatpande"; // This is what the frontend sends
  
  console.log('🔍 Debugging API call with client_id:', client_id);
  console.log('');

  // Step 1: Check progress notes (new system)
  console.log('📊 Step 1: Checking client_progress_notes table...');
  const progressNotesResult = await pool.query(
    `SELECT id, session_number, session_date, session_mode, risk_level,
            client_report, techniques_used, created_at, 'progress_note' as note_type
     FROM client_progress_notes 
     WHERE client_id = $1 
     ORDER BY session_date DESC`,
    [client_id]
  );
  console.log(`   Found ${progressNotesResult.rows.length} progress notes`);
  console.log('');

  // Step 2: Get client info from bookings
  console.log('📊 Step 2: Getting client info from bookings...');
  console.log(`   Query: SELECT DISTINCT invitee_email, invitee_phone FROM bookings WHERE invitee_name ILIKE '%${client_id}%'`);
  const clientInfoResult = await pool.query(
    `SELECT DISTINCT invitee_email, invitee_phone 
     FROM bookings 
     WHERE invitee_name ILIKE $1 
     LIMIT 1`,
    [`%${client_id}%`]
  );
  console.log(`   Found ${clientInfoResult.rows.length} matching bookings`);
  if (clientInfoResult.rows.length > 0) {
    console.log('   Email:', clientInfoResult.rows[0].invitee_email);
    console.log('   Phone:', clientInfoResult.rows[0].invitee_phone);
  }
  console.log('');

  // Step 3: Get session notes
  let sessionNotesResult;
  
  if (clientInfoResult.rows.length > 0) {
    console.log('📊 Step 3: Fetching session notes using email/phone...');
    const { invitee_email, invitee_phone } = clientInfoResult.rows[0];
    
    sessionNotesResult = await pool.query(
      `SELECT DISTINCT csn.note_id as id, csn.session_timing, csn.created_at, 
              csn.client_name, csn.concerns_discussed, csn.somatic_cues, csn.interventions_used,
              'session_note' as note_type, csn.booking_id
       FROM client_session_notes csn
       INNER JOIN bookings b ON csn.booking_id::text = b.booking_id::text
       WHERE b.invitee_email = $1 OR b.invitee_phone = $2
       ORDER BY csn.created_at DESC`,
      [invitee_email, invitee_phone]
    );
  } else {
    console.log('📊 Step 3: Fallback - fetching session notes by name...');
    sessionNotesResult = await pool.query(
      `SELECT DISTINCT csn.note_id as id, csn.session_timing, csn.created_at, 
              csn.client_name, csn.concerns_discussed, csn.somatic_cues, csn.interventions_used,
              'session_note' as note_type, csn.booking_id
       FROM client_session_notes csn
       WHERE csn.client_name ILIKE $1
       ORDER BY csn.created_at DESC`,
      [`%${client_id}%`]
    );
  }
  
  console.log(`   Found ${sessionNotesResult.rows.length} session notes`);
  if (sessionNotesResult.rows.length > 0) {
    sessionNotesResult.rows.forEach(note => {
      console.log(`   - Note ID: ${note.id}, Booking: ${note.booking_id}, Client: ${note.client_name}`);
    });
  }
  console.log('');

  // Step 4: Merge results
  const allNotes = [
    ...progressNotesResult.rows.map(note => ({
      ...note,
      session_date: note.session_date || note.created_at,
      note_type: 'progress_note'
    })),
    ...sessionNotesResult.rows.map(note => ({
      ...note,
      session_date: note.created_at,
      note_type: 'session_note'
    }))
  ];

  console.log('📊 Step 4: Final merged results');
  console.log(`   Total notes: ${allNotes.length}`);
  console.log('');

  console.log('✅ API would return:', JSON.stringify({ success: true, data: allNotes }, null, 2));

  await pool.end();
}

debugAPICall().catch(console.error);
