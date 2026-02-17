import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'safestories',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function analyzeClientDocForms() {
console.log('='.repeat(80));
console.log('CLIENT DOCUMENTATION FORMS & SESSION NOTES ANALYSIS');
console.log('='.repeat(80));

// 1. Check client_doc_form table structure
console.log('\n1. CLIENT_DOC_FORM TABLE STRUCTURE:');
console.log('-'.repeat(80));
try {
  const tableInfo = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'client_doc_form'
    ORDER BY ordinal_position
  `);
  if (tableInfo.rows.length > 0) {
    console.log('Columns:', tableInfo.rows.map((col: any) => `${col.column_name} (${col.data_type})`).join(', '));
  } else {
    console.log('Table does not exist or has no columns');
  }
} catch (error) {
  console.log('Error:', error);
}

// 2. Check if any client doc forms exist and their status
console.log('\n2. CLIENT DOC FORMS - TOTAL COUNT & STATUS:');
console.log('-'.repeat(80));
try {
  const totalForms = await pool.query(`SELECT COUNT(*) as count FROM client_doc_form`);
  console.log(`Total forms in table: ${totalForms.rows[0].count}`);
  
  if (parseInt(totalForms.rows[0].count) > 0) {
    // Check by status
    const byStatus = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM client_doc_form
      GROUP BY status
    `);
    console.log('\nForms by status:');
    byStatus.rows.forEach((row: any) => {
      console.log(`  ${row.status || 'NULL'}: ${row.count}`);
    });
    
    // Check recent forms
    console.log('\n3. RECENT CLIENT DOC FORMS (Last 10):');
    console.log('-'.repeat(80));
    const recentForms = await pool.query(`
      SELECT 
        id,
        client_phone,
        client_email,
        form_type,
        status,
        paperform_submission_id,
        created_at,
        updated_at
      FROM client_doc_form
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    recentForms.rows.forEach((form: any) => {
      console.log(`\nForm ID: ${form.id}`);
      console.log(`  Client: ${form.client_phone || form.client_email}`);
      console.log(`  Type: ${form.form_type}`);
      console.log(`  Status: ${form.status}`);
      console.log(`  Paperform ID: ${form.paperform_submission_id || 'NULL'}`);
      console.log(`  Created: ${form.created_at}`);
      console.log(`  Updated: ${form.updated_at}`);
    });
    
    // Check filled forms
    console.log('\n4. FILLED FORMS (status = "completed" or has paperform_submission_id):');
    console.log('-'.repeat(80));
    const filledForms = await pool.query(`
      SELECT 
        id,
        client_phone,
        client_email,
        form_type,
        status,
        paperform_submission_id,
        created_at
      FROM client_doc_form
      WHERE status = 'completed' OR paperform_submission_id IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    if (filledForms.rows.length > 0) {
      console.log(`Found ${filledForms.rows.length} filled forms:`);
      filledForms.rows.forEach((form: any) => {
        console.log(`\n  Form ID: ${form.id}`);
        console.log(`    Client: ${form.client_phone || form.client_email}`);
        console.log(`    Type: ${form.form_type}`);
        console.log(`    Status: ${form.status}`);
        console.log(`    Paperform ID: ${form.paperform_submission_id}`);
      });
    } else {
      console.log('❌ NO FILLED FORMS FOUND');
    }
  }
} catch (error) {
  console.log('Error:', error);
}

// 5. Check progress_notes / client_progress_notes table
console.log('\n\n5. CLIENT_PROGRESS_NOTES TABLE:');
console.log('-'.repeat(80));
try {
  const tableInfo = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'client_progress_notes'
    ORDER BY ordinal_position
  `);
  if (tableInfo.rows.length > 0) {
    console.log('Columns:', tableInfo.rows.map((col: any) => `${col.column_name} (${col.data_type})`).join(', '));
  } else {
    console.log('Table does not exist');
  }
  
  const count = await pool.query(`SELECT COUNT(*) as count FROM client_progress_notes`);
  console.log(`\nTotal progress notes: ${count.rows[0].count}`);
  
  if (parseInt(count.rows[0].count) > 0) {
    const recent = await pool.query(`
      SELECT 
        id,
        client_id,
        client_name,
        booking_id,
        session_number,
        created_at
      FROM client_progress_notes
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\nRecent progress notes:');
    recent.rows.forEach((note: any) => {
      console.log(`  ID: ${note.id}, Client: ${note.client_name} (${note.client_id}), Booking: ${note.booking_id}, Session: ${note.session_number}`);
    });
  }
} catch (error) {
  console.log('Error or table does not exist:', error);
}

// 6. Check case_history / client_case_history table
console.log('\n\n6. CLIENT_CASE_HISTORY TABLE:');
console.log('-'.repeat(80));
try {
  const tableInfo = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'client_case_history'
    ORDER BY ordinal_position
  `);
  if (tableInfo.rows.length > 0) {
    console.log('Columns:', tableInfo.rows.map((col: any) => `${col.column_name} (${col.data_type})`).join(', '));
  } else {
    console.log('Table does not exist');
  }
  
  const count = await pool.query(`SELECT COUNT(*) as count FROM client_case_history`);
  console.log(`\nTotal case history records: ${count.rows[0].count}`);
  
  if (parseInt(count.rows[0].count) > 0) {
    const recent = await pool.query(`
      SELECT 
        id,
        client_id,
        client_name,
        created_at
      FROM client_case_history
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\nRecent case history:');
    recent.rows.forEach((record: any) => {
      console.log(`  ID: ${record.id}, Client: ${record.client_name} (${record.client_id})`);
    });
  }
} catch (error) {
  console.log('Error or table does not exist:', error);
}

// 7. Check therapy_goals / client_therapy_goals table
console.log('\n\n7. CLIENT_THERAPY_GOALS TABLE:');
console.log('-'.repeat(80));
try {
  const tableInfo = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'client_therapy_goals'
    ORDER BY ordinal_position
  `);
  if (tableInfo.rows.length > 0) {
    console.log('Columns:', tableInfo.rows.map((col: any) => `${col.column_name} (${col.data_type})`).join(', '));
  } else {
    console.log('Table does not exist');
  }
  
  const count = await pool.query(`SELECT COUNT(*) as count FROM client_therapy_goals`);
  console.log(`\nTotal therapy goals: ${count.rows[0].count}`);
  
  if (parseInt(count.rows[0].count) > 0) {
    const recent = await pool.query(`
      SELECT 
        id,
        client_id,
        client_name,
        created_at
      FROM client_therapy_goals
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\nRecent therapy goals:');
    recent.rows.forEach((goal: any) => {
      console.log(`  ID: ${goal.id}, Client: ${goal.client_name} (${goal.client_id})`);
    });
  }
} catch (error) {
  console.log('Error or table does not exist:', error);
}

// 8. Check free_consultation_notes table
console.log('\n\n8. FREE_CONSULTATION_NOTES TABLE:');
console.log('-'.repeat(80));
try {
  const tableInfo = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'free_consultation_notes'
    ORDER BY ordinal_position
  `);
  if (tableInfo.rows.length > 0) {
    console.log('Columns:', tableInfo.rows.map((col: any) => `${col.column_name} (${col.data_type})`).join(', '));
  } else {
    console.log('Table does not exist');
  }
  
  const count = await pool.query(`SELECT COUNT(*) as count FROM free_consultation_notes`);
  console.log(`\nTon notes: ${count.rows[0].count}`);
  
  if (parseInt(count.rows[0].count) > 0) {
    const recent = await pool.query(`
      SELECT 
        id,
        client_id,
        client_name,
        booking_id,
        created_at
      FROM free_consultation_notes
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\nRecent free consultation notes:');
    recent.rows.forEach((note: any) => {
      console.log(`  ID: ${noking_id}`);
    });
  }
} catch (error) {
  console.log('Error or table does not exist:', error);
}ote.id}, Client: ${note.client_name} (${note.client_id}), Booking: ${note.bo

// 9. Check how session notes are created - look at triggers
console.log('\n\n9. DATABASE TRIGGERS (for automatic data population):');
console.log('-'.repeat(80));
try {
  const triggers = await pool.query(`
    SELECT 
      trigger_name,
      event_object_table,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY trigger_name
  `);
  
  if (triggers.rows.length > 0) {
    triggers.rows.forEach((trigger: any) => {
      console.log(`\nTrigger: ${trigger.trigger_name}`);
      console.log(`Table: ${trigger.event_object_table}`);
      console.log(`Action: ${trigger.action_statement?.substring(0, 200)}...`);
    });
  } else {
    console.log('No triggers found');
  }
} catch (error) {
  console.log('Error:', error);
}

// 10. Check relationship between client_doc_form and other tables
console.log('\n\n10. DATA FLOW ANALYSIS:');
console.log('-'.repeat(80));
console.log('Checking if client_doc_form data populates other tables...\n');

try {
  // Check if there's any correlation
  const docFormCount = await pool.query(`SELECT COUNT(*) as count FROM client_doc_form`);
  const progressNotesCount = await pool.query(`SELECT COUNT(*) as count FROM client_progress_notes`);
  const caseHistoryCount = await pool.query(`SELECT COUNT(*) as count FROM client_case_history`);
  const therapyGoalsCount = await pool.query(`SELECT COUNT(*) as count FROM client_therapy_goals`);
  
  console.log('Table Counts:');
  console.log(`  client_doc_form: ${docFormCount.rows[0].count}`);
  console.log(`  client_progress_notes: ${progressNotesCount.rows[0].count}`);
  console.log(`  client_case_history: ${caseHistoryCount.rows[0].count}`);
  console.log(`  client_therapy_goals: ${therapyGoalsCount.rows[0].count}`);
  
  // Check if any progress notes reference client_doc_form
  const progressNotesSchema = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'client_progress_notes'
  `);
  const hasDocFormRef = progressNotesSchema.rows.some((col: any) => 
    col.column_name.includes('doc_form') || col.column_name.includes('form_id')
  );
  console.log(`\nProgress notes has doc_form reference: ${hasDocFormRef}`);
  
} catch (error) {
  console.log('Error:', error);
}

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS COMPLETE');
console.log('='.repeat(80));

await pool.end();
}

analyzeClientDocForms().catch(console.error);
