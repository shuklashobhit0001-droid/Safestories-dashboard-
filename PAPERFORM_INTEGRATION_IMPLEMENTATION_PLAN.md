# PAPERFORM INTEGRATION - COMPLETE IMPLEMENTATION PLAN

## 📊 CURRENT STATE ANALYSIS

### ✅ What EXISTS:
- `free_consultation_pretherapy_notes` table (28 columns) - **EMPTY**
- `client_progress_notes` table (33 columns) - **EMPTY**
- `client_case_history` table (30+ columns) - **EMPTY**
- `client_therapy_goals` table - **EMPTY**
- `client_session_notes` table - **15 RECORDS** (currently being used)
- `client_doc_form` table - **78 records** (13 completed)

### ❌ What's MISSING:
- `session_type` column in `client_doc_form` table
- Paperform webhook endpoint to receive form submissions
- Data routing logic to populate correct tables

### 📋 BOOKINGS DATA:
- Free consultations identified by: `booking_resource_name = 'Free Consultation - SafeStories'`
- 13 free consultation bookings found

---

## 🎯 IMPLEMENTATION STRATEGY

### **TWO PAPERFORM FORMS:**

**Form 1: Therapy Documentation Sheet** (Paid Sessions)
- URL: [To be configured in Paperform]
- Webhook: POST to `/api/paperform-webhook/therapy-documentation`
- Session Types: First Session, Follow-up Session

**Form 2: Free Consultation Notes**
- URL: [To be configured in Paperform]
- Webhook: POST to `/api/paperform-webhook/free-consultation`
- Session Type: Free Consultation

---

## 🔧 STEP-BY-STEP IMPLEMENTATION

### **PHASE 1: Database Schema Updates**

#### 1.1 Add session_type column to client_doc_form
```sql
ALTER TABLE client_doc_form 
ADD COLUMN session_type VARCHAR(50);

-- Add index for performance
CREATE INDEX idx_client_doc_form_session_type 
ON client_doc_form(session_type);

-- Update existing records based on booking type
UPDATE client_doc_form cdf
SET session_type = CASE 
  WHEN b.booking_resource_name = 'Free Consultation - SafeStories' 
    THEN 'free_consultation'
  ELSE 'paid_session'
END
FROM bookings b
WHERE cdf.booking_id = b.booking_id;
```

#### 1.2 Add paperform_submission_id column (if not exists)
```sql
ALTER TABLE client_doc_form 
ADD COLUMN IF NOT EXISTS paperform_submission_id VARCHAR(255);
```

#### 1.3 Add client_id column to free_consultation_pretherapy_notes (if not exists)
```sql
ALTER TABLE free_consultation_pretherapy_notes 
ADD COLUMN IF NOT EXISTS client_id VARCHAR(255);
```

---

### **PHASE 2: Create Webhook Endpoints**

#### 2.1 Free Consultation Webhook
**Endpoint:** `POST /api/paperform-webhook/free-consultation`

**Request Body (from Paperform):**
```json
{
  "submission_id": "abc123",
  "data": {
    "client_name": "John Doe",
    "client_id": "CL001",
    "booking_id": "685118",
    "session_date": "2026-02-10",
    "session_timing": "10:00 AM - 11:00 AM",
    "session_duration": "60 minutes",
    "therapist_name": "Dr. Smith",
    "session_mode": "Telephonic",
    "presenting_concerns": "...",
    "duration_onset": "...",
    "triggers_factors": "...",
    "therapy_overview_given": true,
    "client_questions": "...",
    "answers_given": "...",
    "preferred_languages": "English, Hindi",
    "preferred_modes": "Online",
    "preferred_price_range": "₹1000-₹2000",
    "preferred_time_slots": "Evenings",
    "assigned_therapist_name": "Dr. Smith",
    "chatbot_booking_explained": true,
    "clinical_concerns_mentioned": false,
    "clinical_concerns_details": "",
    "suicidal_thoughts_mentioned": false,
    "suicidal_thoughts_details": "",
    "other_notes": "..."
  }
}
```

**Logic:**
1. Validate booking_id exists in client_doc_form
2. Check session_type = 'free_consultation'
3. Insert data into `free_consultation_pretherapy_notes`
4. Update `client_doc_form` status = 'completed'
5. Store paperform_submission_id
6. Send notification to admin

---

#### 2.2 Therapy Documentation Webhook
**Endpoint:** `POST /api/paperform-webhook/therapy-documentation`

**Request Body (from Paperform):**
```json
{
  "submission_id": "xyz789",
  "data": {
    // Section A: Session Basics (Prefilled)
    "client_name": "Jane Doe",
    "client_id": "CL002",
    "booking_id": "685119",
    "session_date": "2026-02-10",
    "session_start_time": "10:00 AM",
    "session_end_time": "11:00 AM",
    "session_duration": "60 minutes",
    "therapist_name": "Dr. Smith",
    "session_mode": "Online",
    "session_number": 1,
    
    // Section B: Case History (First Session Only)
    "full_name": "Jane Doe",
    "age": 28,
    "gender_identity": "Female",
    "education": "Masters",
    "occupation": "Software Engineer",
    "primary_income": "Salary",
    "marital_status": "Single",
    "children": "None",
    "religion": "Hindu",
    "socio_economic_status": "Middle Class",
    "city_state": "Mumbai, Maharashtra",
    "presenting_concerns": "...",
    "duration_onset": "...",
    "triggers_factors": "...",
    "sleep": "Disturbed",
    "appetite": "Normal",
    "energy_levels": "Low",
    "weight_changes": "None",
    "libido": "...",
    "menstrual_history": "...",
    "family_history": "...",
    "genogram_url": "...",
    "developmental_history": "...",
    "medical_history": "...",
    "medications": "...",
    "previous_mental_health": "...",
    "insight_level": "Intellectual insight",
    
    // Section C: Goal Tracking
    "therapy_goals": "...",
    "goal_stage": "Initiation",
    
    // Section D: Progress Notes
    "client_report": "...",
    "direct_quotes": "...",
    "client_presentation": ["Anxious", "Engaged"],
    "techniques_used": "CBT, Grounding",
    "homework_assigned": "...",
    "client_reaction": ["Engaged", "Reflective"],
    "engagement_notes": "...",
    "themes_patterns": "...",
    "progress_regression": "...",
    "clinical_concerns": "...",
    "self_harm_mention": false,
    "self_harm_details": "",
    "risk_level": "None",
    "risk_factors": "",
    "protective_factors": "...",
    "safety_plan": "",
    "future_interventions": "...",
    "session_frequency": "Weekly",
    
    // Section E: Therapist Declaration
    "therapist_signature": "Dr. Smith",
    "signature_date": "2026-02-10"
  }
}
```

**Logic:**
1. Validate booking_id exists in client_doc_form
2. Check session_type = 'paid_session'
3. Determine if first session (session_number = 1)
4. **IF FIRST SESSION:**
   - Insert Section B → `client_case_history`
   - Insert Section C → `client_therapy_goals`
   - Insert Section D → `client_progress_notes`
5. **IF FOLLOW-UP SESSION:**
   - Insert Section D → `client_progress_notes`
   - Update Section C → `client_therapy_goals` (if goals changed)
6. Update `client_doc_form` status = 'completed'
7. Store paperform_submission_id
8. Send notification to admin

---

### **PHASE 3: Update UI Components**

#### 3.1 Progress Notes Tab (ProgressNotesTab.tsx)
- ✅ Already reads from `client_progress_notes`
- Will automatically show data once webhook populates table

#### 3.2 Case History Tab (CaseHistoryTab.tsx)
- ✅ Already reads from `client_case_history`
- Will automatically show data once webhook populates table

#### 3.3 Goal Tracking Tab (GoalTrackingTab.tsx)
- ✅ Already reads from `client_therapy_goals`
- Will automatically show data once webhook populates table

#### 3.4 Free Consultation Detail (FreeConsultationDetail.tsx)
- ✅ Already reads from `free_consultation_notes`
- Need to update to read from `free_consultation_pretherapy_notes`

---

### **PHASE 4: Paperform Configuration**

#### 4.1 Form 1: Therapy Documentation Sheet
1. Create form in Paperform with all sections
2. Configure webhook URL: `https://your-domain.com/api/paperform-webhook/therapy-documentation`
3. Map form fields to JSON structure
4. Test with sample submission

#### 4.2 Form 2: Free Consultation Notes
1. Create form in Paperform with all sections
2. Configure webhook URL: `https://your-domain.com/api/paperform-webhook/free-consultation`
3. Map form fields to JSON structure
4. Test with sample submission

---

### **PHASE 5: Update Form Link Generation**

#### 5.1 When creating paperform link in client_doc_form:
```typescript
// Determine session type from booking
const booking = await pool.query(
  'SELECT booking_resource_name FROM bookings WHERE booking_id = $1',
  [booking_id]
);

const sessionType = booking.rows[0].booking_resource_name === 'Free Consultation - SafeStories'
  ? 'free_consultation'
  : 'paid_session';

// Use appropriate Paperform URL
const paperformUrl = sessionType === 'free_consultation'
  ? process.env.PAPERFORM_FREE_CONSULTATION_URL
  : process.env.PAPERFORM_THERAPY_DOCUMENTATION_URL;

// Add prefill parameters
const prefillParams = new URLSearchParams({
  client_name: clientName,
  client_id: clientId,
  booking_id: bookingId,
  // ... other prefill fields
});

const paperformLink = `${paperformUrl}?${prefillParams.toString()}`;

// Insert into client_doc_form
await pool.query(`
  INSERT INTO client_doc_form (booking_id, paperform_link, session_type, status)
  VALUES ($1, $2, $3, 'pending')
`, [bookingId, paperformLink, sessionType]);
```

---

## 📋 FIELD MAPPING REFERENCE

### Free Consultation Form → free_consultation_pretherapy_notes

| Paperform Field | Database Column |
|----------------|-----------------|
| Client Name | client_name |
| Client ID | client_id |
| Booking ID | booking_id |
| Date | session_date |
| Session Start Time - End Time | session_timing |
| Session Duration | session_duration |
| Therapist Name | therapist_name |
| Mode of Session | session_mode |
| Presenting concern(s) | presenting_concerns |
| Duration & onset | duration_onset |
| Triggers or maintaining factors | triggers_factors |
| Overview of therapy given? | therapy_overview_given |
| Questions that the client asked | client_questions |
| Brief of answers given | answers_given |
| Preferred Language(s) | preferred_languages |
| Preferred Mode(s) | preferred_modes |
| Preferred Price Range | preferred_price_range |
| Preferred Time slot(s) | preferred_time_slots |
| Name of Assigned therapist | assigned_therapist_name |
| Booking process explained? | chatbot_booking_explained |
| Clinical concerns mentioned? | clinical_concerns_mentioned |
| Clinical concerns details | clinical_concerns_details |
| Suicidal thoughts mentioned? | suicidal_thoughts_mentioned |
| Suicidal thoughts details | suicidal_thoughts_details |
| Any other notes? | other_notes |

### Therapy Documentation Form → Multiple Tables

#### Section B → client_case_history

| Paperform Field | Database Column |
|----------------|-----------------|
| Full Name | client_name |
| Age | age |
| Gender Identity | gender_identity |
| Education | education |
| Occupation | occupation |
| Primary Income Source(s) | primary_income |
| Marital Status | marital_status |
| Children | children |
| Religion / Cultural Background | religion |
| Socio‑Economic Status | socio_economic_status |
| City & State | city_state |
| Presenting concern(s) | presenting_concerns |
| Duration & onset | duration_onset |
| Triggers or maintaining factors | triggers_factors |
| Sleep | sleep |
| Appetite | appetite |
| Energy Levels | energy_levels |
| Weight Changes | weight_changes |
| Libido | libido |
| Menstrual History | menstrual_history |
| Family History & Genogram | family_history, genogram_url |
| Developmental History | developmental_history |
| Medical History | medical_history |
| Medications | medications |
| Previous Mental Health History | previous_mental_health |
| Insight | insight_level |

#### Section C → client_therapy_goals

| Paperform Field | Database Column |
|----------------|-----------------|
| Therapy goals and expectations | goal_description |
| Current stage of goals | current_stage |

#### Section D → client_progress_notes

| Paperform Field | Database Column |
|----------------|-----------------|
| Session Number | session_number |
| Date | session_date |
| Session Duration | session_duration |
| Mode of Session | session_mode |
| What did the client bring up today? | client_report |
| Direct quotes | direct_quotes |
| How did the client present today? | client_presentation, presentation_tags |
| Techniques/interventions used | techniques_used |
| Homework assigned | homework_assigned |
| Client's reaction | client_reaction, reaction_tags |
| Engagement notes | engagement_notes |
| Themes and patterns | themes_patterns |
| Progress/regression | progress_regression |
| Clinical concerns | clinical_concerns |
| Any mention of self-harm | self_harm_mention, self_harm_details |
| Current Risk Level | risk_level |
| Risk Factors | risk_factors |
| Protective Factors | protective_factors |
| Safety Plan | safety_plan |
| Future interventions | future_interventions |
| Frequency of sessions | session_frequency |
| Therapist Signature | therapist_signature |
| Date | signature_date |

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Phase 1: Database schema updates
  - [ ] Add session_type column
  - [ ] Add paperform_submission_id column
  - [ ] Update existing records
  - [ ] Create indexes
  
- [ ] Phase 2: Create webhook endpoints
  - [ ] Implement free consultation webhook
  - [ ] Implement therapy documentation webhook
  - [ ] Add error handling and logging
  - [ ] Test with sample data
  
- [ ] Phase 3: Update UI components
  - [ ] Verify Progress Notes Tab
  - [ ] Verify Case History Tab
  - [ ] Verify Goal Tracking Tab
  - [ ] Update Free Consultation Detail
  
- [ ] Phase 4: Paperform configuration
  - [ ] Create Form 1 (Therapy Documentation)
  - [ ] Create Form 2 (Free Consultation)
  - [ ] Configure webhooks
  - [ ] Test form submissions
  
- [ ] Phase 5: Update form link generation
  - [ ] Update backend logic
  - [ ] Add environment variables
  - [ ] Test link generation
  
- [ ] Testing
  - [ ] Test free consultation flow end-to-end
  - [ ] Test first session flow end-to-end
  - [ ] Test follow-up session flow end-to-end
  - [ ] Verify data in all tables
  - [ ] Verify UI displays correctly
  
- [ ] Documentation
  - [ ] Update API documentation
  - [ ] Create user guide for therapists
  - [ ] Document troubleshooting steps

---

## 📝 NEXT IMMEDIATE STEPS

**Should I proceed with:**

1. ✅ Creating the database migration script for Phase 1?
2. ✅ Implementing the webhook endpoints for Phase 2?
3. ✅ Creating the field mapping configuration file?
4. ✅ Updating the UI components for Phase 3?

**Please confirm to proceed with implementation!**
