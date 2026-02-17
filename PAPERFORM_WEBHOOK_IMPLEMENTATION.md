# PAPERFORM WEBHOOK IMPLEMENTATION - COMPLETE GUIDE

## 📊 OVERVIEW

**Date:** February 16, 2026  
**Status:** ✅ Backend Implementation Complete

This document explains the Paperform webhook integration that routes form submissions to the correct database tables based on session type.

---

## 🎯 SOLUTION ARCHITECTURE

### **Two Paperform Forms → Two Webhook Endpoints**

**Form 1: Free Consultation Notes**
- Paperform URL: [To be configured]
- Webhook: `POST /api/paperform-webhook/free-consultation`
- Target Table: `free_consultation_pretherapy_notes`
- Session Type: `'Free Consultation - SafeStories'`

**Form 2: Therapy Documentation Sheet**
- Paperform URL: [To be configured]
- Webhook: `POST /api/paperform-webhook/therapy-documentation`
- Target Tables: `client_case_history`, `client_progress_notes`, `client_therapy_goals`
- Session Types: All other session types (Individual, Adolescent, etc.)

---

## 🔄 DATA FLOW

### **Current Workflow:**

```
1. Session ends
   ↓
2. N8N generates Paperform link
   ↓
3. N8N stores link in client_doc_form table with session_type
   ↓
4. N8N sends link to therapist
   ↓
5. Therapist fills Paperform
   ↓
6. Paperform webhook → Backend endpoint (NEW!)
   ↓
7. Backend checks session_type from client_doc_form
   ↓
8. Backend routes data to appropriate tables
   ↓
9. Backend updates client_doc_form status = 'completed'
   ↓
10. UI displays data from correct tables ✅
```

---

## 🔧 BACKEND ENDPOINTS IMPLEMENTED

### **1. POST /api/paperform-webhook/free-consultation**

**Purpose:** Receive and store free consultation form submissions

**Request Body:**
```json
{
  "submission_id": "paperform_abc123",
  "booking_id": "685118",
  "data": {
    "client_name": "John Doe",
    "client_id": "CL001",
    "session_date": "2026-02-10",
    "session_timing": "10:00 AM - 11:00 AM",
    "session_duration": "60 minutes",
    "therapist_name": "Dr. Smith",
    "session_mode": "Telephonic",
    "presenting_concerns": "Anxiety and stress",
    "duration_onset": "6 months",
    "triggers_factors": "Work pressure",
    "therapy_overview_given": true,
    "client_questions": "How long will therapy take?",
    "answers_given": "Typically 8-12 sessions",
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
    "other_notes": "Client seems motivated"
  }
}
```

**Logic:**
1. Validates `booking_id` exists in `client_doc_form`
2. Verifies `session_type = 'Free Consultation - SafeStories'`
3. Inserts data into `free_consultation_pretherapy_notes`
4. Updates `client_doc_form` status to 'completed'
5. Stores `paperform_submission_id`

**Response:**
```json
{
  "success": true,
  "message": "Free consultation notes stored successfully"
}
```

---

### **2. POST /api/paperform-webhook/therapy-documentation**

**Purpose:** Receive and store therapy documentation (paid sessions)

**Request Body:**
```json
{
  "submission_id": "paperform_xyz789",
  "booking_id": "685119",
  "data": {
    "client_id": "CL002",
    "client_name": "Jane Doe",
    "session_date": "2026-02-10",
    "session_duration": "60 minutes",
    "session_mode": "Online",
    "session_number": 1,
    "therapist_name": "Dr. Smith",
    "therapist_signature": "Dr. Smith",
    "signature_date": "2026-02-10",
    
    "case_history": {
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
      "presenting_concerns": "Anxiety and depression",
      "duration_onset": "1 year",
      "triggers_factors": "Work stress",
      "sleep": "Disturbed",
      "appetite": "Normal",
      "energy_levels": "Low",
      "weight_changes": "None",
      "libido": "Normal",
      "menstrual_history": "Regular",
      "family_history": "No mental health history",
      "genogram_url": "",
      "developmental_history": "Normal childhood",
      "medical_history": "None",
      "medications": "None",
      "previous_mental_health": "No previous therapy",
      "insight_level": "Intellectual insight"
    },
    
    "progress_notes": {
      "client_report": "Feeling anxious about work",
      "direct_quotes": "I can't handle the pressure",
      "client_presentation": "Anxious, engaged",
      "presentation_tags": ["Anxious", "Engaged"],
      "techniques_used": "CBT, grounding exercises",
      "homework_assigned": "Practice breathing exercises",
      "client_reaction": "Engaged, reflective",
      "reaction_tags": ["Engaged", "Reflective"],
      "engagement_notes": "Client was open and willing",
      "themes_patterns": "Perfectionism, fear of failure",
      "progress_regression": "No previous sessions",
      "clinical_concerns": "Moderate anxiety",
      "self_harm_mention": false,
      "self_harm_details": "",
      "risk_level": "Low",
      "risk_factors": "Work stress",
      "protective_factors": "Strong family support",
      "safety_plan": "",
      "future_interventions": "Continue CBT",
      "session_frequency": "Weekly"
    },
    
    "therapy_goals": {
      "goal_description": "Reduce anxiety and improve coping skills",
      "current_stage": "Initiation"
    }
  }
}
```

**Logic:**
1. Validates `booking_id` exists in `client_doc_form`
2. Verifies `session_type != 'Free Consultation - SafeStories'`
3. Checks if first session (`session_number = 1`)
4. **If First Session:**
   - Inserts `case_history` → `client_case_history`
   - Inserts `progress_notes` → `client_progress_notes`
   - Inserts `therapy_goals` → `client_therapy_goals`
5. **If Follow-up Session:**
   - Inserts `progress_notes` → `client_progress_notes`
   - Updates `therapy_goals` → `client_therapy_goals` (if provided)
6. Updates `client_doc_form` status to 'completed'
7. Stores `paperform_submission_id`

**Response:**
```json
{
  "success": true,
  "message": "Therapy documentation stored successfully"
}
```

---

### **3. GET /api/free-consultation-notes**

**Purpose:** Fetch list of free consultation notes for a client

**Query Parameters:**
- `client_id` (required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "session_date": "2026-02-10",
      "session_mode": "Telephonic",
      "presenting_concerns": "Anxiety and stress",
      "assigned_therapist_name": "Dr. Smith",
      "created_at": "2026-02-10T10:00:00Z"
    }
  ]
}
```

---

### **4. GET /api/free-consultation-notes/:id**

**Purpose:** Fetch single free consultation note details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "client_name": "John Doe",
    "client_id": "CL001",
    "booking_id": "685118",
    "session_date": "2026-02-10",
    "session_timing": "10:00 AM - 11:00 AM",
    "session_duration": "60 minutes",
    "therapist_name": "Dr. Smith",
    "session_mode": "Telephonic",
    "presenting_concerns": "Anxiety and stress",
    "duration_onset": "6 months",
    "triggers_factors": "Work pressure",
    "therapy_overview_given": true,
    "client_questions": "How long will therapy take?",
    "answers_given": "Typically 8-12 sessions",
    "preferred_languages": "English, Hindi",
    "preferred_modes": "Online",
    "preferred_price_range": "₹1000-₹2000",
    "preferred_time_slots": "Evenings",
    "assigned_therapist_name": "Dr. Smith",
    "chatbot_booking_explained": true,
    "clinical_concerns_mentioned": false,
    "clinical_concerns_details": null,
    "suicidal_thoughts_mentioned": false,
    "suicidal_thoughts_details": null,
    "other_notes": "Client seems motivated",
    "created_at": "2026-02-10T10:00:00Z",
    "updated_at": "2026-02-10T10:00:00Z"
  }
}
```

---

## 📋 PAPERFORM CONFIGURATION

### **Step 1: Configure Free Consultation Form**

1. Go to Paperform dashboard
2. Create/Edit "Free Consultation Notes" form
3. Go to Settings → Integrations → Webhooks
4. Add webhook URL: `https://your-domain.com/api/paperform-webhook/free-consultation`
5. Method: POST
6. Map form fields to JSON structure (see request body above)
7. Include hidden fields:
   - `booking_id` (prefilled from URL parameter)
   - `submission_id` (Paperform's submission ID)

### **Step 2: Configure Therapy Documentation Form**

1. Go to Paperform dashboard
2. Create/Edit "Therapy Documentation Sheet" form
3. Go to Settings → Integrations → Webhooks
4. Add webhook URL: `https://your-domain.com/api/paperform-webhook/therapy-documentation`
5. Method: POST
6. Map form fields to JSON structure (see request body above)
7. Include hidden fields:
   - `booking_id` (prefilled from URL parameter)
   - `submission_id` (Paperform's submission ID)
   - `client_id` (prefilled)
   - `client_name` (prefilled)
   - `session_number` (prefilled or calculated)

---

## 🔗 N8N INTEGRATION

### **What N8N Needs to Do:**

1. **When generating Paperform link:**
   - Query bookings table to get `booking_resource_name`
   - Determine which form to use:
     - If `booking_resource_name = 'Free Consultation - SafeStories'` → Use Free Consultation form
     - Else → Use Therapy Documentation form
   - Add prefill parameters to URL:
     ```
     ?booking_id=685118&client_id=CL001&client_name=John+Doe&session_number=1
     ```
   - Store link in `client_doc_form` with exact `session_type` (booking_resource_name)

2. **After form submission:**
   - N8N doesn't need to do anything!
   - Paperform webhook directly calls backend
   - Backend handles all data routing and storage

---

## ✅ UI COMPONENTS (Already Configured)

The UI components are already reading from the correct tables:

1. **ProgressNotesTab.tsx**
   - Reads from `/api/progress-notes` → `client_progress_notes` ✅
   - Reads from `/api/free-consultation-notes` → `free_consultation_pretherapy_notes` ✅

2. **CaseHistoryTab.tsx**
   - Reads from `/api/case-history` → `client_case_history` ✅

3. **GoalTrackingTab.tsx**
   - Reads from `/api/therapy-goals` → `client_therapy_goals` ✅

4. **FreeConsultationDetail.tsx**
   - Reads from `/api/free-consultation-notes/:id` → `free_consultation_pretherapy_notes` ✅

---

## 🧪 TESTING

### **Test Free Consultation Webhook:**

```bash
curl -X POST https://your-domain.com/api/paperform-webhook/free-consultation \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "test_123",
    "booking_id": "685118",
    "data": {
      "client_name": "Test Client",
      "client_id": "TEST001",
      "session_date": "2026-02-16",
      "session_timing": "10:00 AM - 11:00 AM",
      "session_duration": "60 minutes",
      "therapist_name": "Test Therapist",
      "session_mode": "Telephonic",
      "presenting_concerns": "Test concerns",
      "duration_onset": "1 month",
      "triggers_factors": "Test triggers",
      "therapy_overview_given": true,
      "client_questions": "Test questions",
      "answers_given": "Test answers",
      "preferred_languages": "English",
      "preferred_modes": "Online",
      "preferred_price_range": "₹1000-₹2000",
      "preferred_time_slots": "Evenings",
      "assigned_therapist_name": "Test Therapist",
      "chatbot_booking_explained": true,
      "clinical_concerns_mentioned": false,
      "suicidal_thoughts_mentioned": false,
      "other_notes": "Test notes"
    }
  }'
```

### **Test Therapy Documentation Webhook:**

```bash
curl -X POST https://your-domain.com/api/paperform-webhook/therapy-documentation \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "test_456",
    "booking_id": "685119",
    "data": {
      "client_id": "TEST002",
      "client_name": "Test Client 2",
      "session_date": "2026-02-16",
      "session_duration": "60 minutes",
      "session_mode": "Online",
      "session_number": 1,
      "therapist_name": "Test Therapist",
      "therapist_signature": "Test Therapist",
      "signature_date": "2026-02-16",
      "case_history": {
        "age": 30,
        "gender_identity": "Female",
        "education": "Masters",
        "occupation": "Engineer",
        "primary_income": "Salary",
        "marital_status": "Single",
        "children": "None",
        "religion": "Hindu",
        "socio_economic_status": "Middle Class",
        "city_state": "Mumbai, Maharashtra",
        "presenting_concerns": "Test concerns",
        "duration_onset": "1 year",
        "triggers_factors": "Test triggers",
        "sleep": "Normal",
        "appetite": "Normal",
        "energy_levels": "Normal",
        "weight_changes": "None",
        "libido": "Normal",
        "menstrual_history": "Regular",
        "family_history": "None",
        "genogram_url": "",
        "developmental_history": "Normal",
        "medical_history": "None",
        "medications": "None",
        "previous_mental_health": "None",
        "insight_level": "Good"
      },
      "progress_notes": {
        "client_report": "Test report",
        "direct_quotes": "Test quotes",
        "client_presentation": "Normal",
        "presentation_tags": ["Engaged"],
        "techniques_used": "CBT",
        "homework_assigned": "Test homework",
        "client_reaction": "Positive",
        "reaction_tags": ["Engaged"],
        "engagement_notes": "Good engagement",
        "themes_patterns": "Test themes",
        "progress_regression": "None",
        "clinical_concerns": "None",
        "self_harm_mention": false,
        "self_harm_details": "",
        "risk_level": "None",
        "risk_factors": "",
        "protective_factors": "Family support",
        "safety_plan": "",
        "future_interventions": "Continue therapy",
        "session_frequency": "Weekly"
      },
      "therapy_goals": {
        "goal_description": "Test goal",
        "current_stage": "Initiation"
      }
    }
  }'
```

---

## 📊 DATABASE VERIFICATION

### **Check if free consultation was stored:**
```sql
SELECT * FROM free_consultation_pretherapy_notes 
WHERE booking_id = '685118';
```

### **Check if therapy documentation was stored:**
```sql
-- Case history
SELECT * FROM client_case_history 
WHERE client_id = 'TEST002';

-- Progress notes
SELECT * FROM client_progress_notes 
WHERE client_id = 'TEST002';

-- Therapy goals
SELECT * FROM client_therapy_goals 
WHERE client_id = 'TEST002';
```

### **Check if client_doc_form was updated:**
```sql
SELECT booking_id, status, paperform_submission_id 
FROM client_doc_form 
WHERE booking_id IN ('685118', '685119');
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [x] Backend endpoints implemented
- [x] GET endpoints for UI added
- [x] Error handling and validation added
- [x] Logging added for debugging
- [ ] Paperform forms configured
- [ ] Webhook URLs added to Paperform
- [ ] N8N updated to use correct form URLs
- [ ] Test with real form submissions
- [ ] Verify data appears in UI
- [ ] Monitor logs for errors

---

## 🔍 TROUBLESHOOTING

### **Issue: "Booking not found in client_doc_form"**
- Check if `booking_id` exists in `client_doc_form` table
- Verify N8N is creating the record before sending form link

### **Issue: "Invalid session type"**
- Check `session_type` column in `client_doc_form`
- Verify it matches expected values:
  - Free consultation: `'Free Consultation - SafeStories'`
  - Paid sessions: Any other value

### **Issue: Data not appearing in UI**
- Check if webhook was called successfully (check server logs)
- Verify data was inserted into correct tables
- Check if `client_id` matches between tables
- Verify UI is querying with correct `client_id`

### **Issue: "Failed to store documentation"**
- Check server logs for detailed error message
- Verify all required fields are present in request
- Check database constraints (foreign keys, NOT NULL, etc.)

---

## 📝 NEXT STEPS

1. **Configure Paperform Forms:**
   - Create/update forms with all required fields
   - Add webhook URLs
   - Test form submissions

2. **Update N8N Workflow:**
   - Update link generation logic
   - Use correct form URLs based on session type
   - Add prefill parameters

3. **Test End-to-End:**
   - Create test booking
   - Generate form link
   - Fill and submit form
   - Verify data in database
   - Check UI displays correctly

4. **Monitor and Iterate:**
   - Watch server logs for errors
   - Gather therapist feedback
   - Adjust field mappings as needed

---

**Implementation Status:** ✅ Backend Complete  
**Next:** Configure Paperform and N8N

