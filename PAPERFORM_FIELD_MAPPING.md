# PAPERFORM FIELD MAPPING REFERENCE

## 📋 FORM 1: FREE CONSULTATION NOTES

### **Webhook URL:**
```
POST /api/paperform-webhook/free-consultation
```

### **Hidden Fields (Prefilled by URL):**
- `booking_id` - From URL parameter
- `submission_id` - Paperform's submission ID

### **Field Mapping:**

| Form Field Label | JSON Key | Database Column | Type | Required |
|-----------------|----------|-----------------|------|----------|
| Client Name | `client_name` | `client_name` | text | Yes |
| Client ID | `client_id` | `client_id` | text | Yes |
| Date | `session_date` | `session_date` | date | Yes |
| Session Start Time - End Time | `session_timing` | `session_timing` | text | Yes |
| Session Duration | `session_duration` | `session_duration` | text | Yes |
| Therapist Name | `therapist_name` | `therapist_name` | text | Yes |
| Mode of Session | `session_mode` | `session_mode` | text | Yes |
| Presenting concern(s) | `presenting_concerns` | `presenting_concerns` | textarea | Yes |
| Duration & onset | `duration_onset` | `duration_onset` | textarea | No |
| Any triggers or maintaining factors | `triggers_factors` | `triggers_factors` | textarea | No |
| Overview of therapy given? | `therapy_overview_given` | `therapy_overview_given` | boolean | No |
| Questions that the client asked | `client_questions` | `client_questions` | textarea | No |
| Brief of answers given | `answers_given` | `answers_given` | textarea | No |
| Preferred Language(s) | `preferred_languages` | `preferred_languages` | text | No |
| Preferred Mode(s) | `preferred_modes` | `preferred_modes` | text | No |
| Preferred Price Range | `preferred_price_range` | `preferred_price_range` | text | No |
| Preferred Time slot(s) | `preferred_time_slots` | `preferred_time_slots` | text | No |
| Name of Assigned therapist | `assigned_therapist_name` | `assigned_therapist_name` | text | No |
| Booking process through Chatbot explained? | `chatbot_booking_explained` | `chatbot_booking_explained` | boolean | No |
| Any clinical concerns mentioned? | `clinical_concerns_mentioned` | `clinical_concerns_mentioned` | boolean | No |
| Clinical concerns details | `clinical_concerns_details` | `clinical_concerns_details` | textarea | No |
| Any suicidal thoughts mentioned? | `suicidal_thoughts_mentioned` | `suicidal_thoughts_mentioned` | boolean | No |
| Suicidal thoughts details | `suicidal_thoughts_details` | `suicidal_thoughts_details` | textarea | No |
| Any other notes? | `other_notes` | `other_notes` | textarea | No |

### **Example Paperform Webhook Payload:**
```json
{
  "submission_id": "{{submission_id}}",
  "booking_id": "{{booking_id}}",
  "data": {
    "client_name": "{{client_name}}",
    "client_id": "{{client_id}}",
    "session_date": "{{session_date}}",
    "session_timing": "{{session_timing}}",
    "session_duration": "{{session_duration}}",
    "therapist_name": "{{therapist_name}}",
    "session_mode": "{{session_mode}}",
    "presenting_concerns": "{{presenting_concerns}}",
    "duration_onset": "{{duration_onset}}",
    "triggers_factors": "{{triggers_factors}}",
    "therapy_overview_given": {{therapy_overview_given}},
    "client_questions": "{{client_questions}}",
    "answers_given": "{{answers_given}}",
    "preferred_languages": "{{preferred_languages}}",
    "preferred_modes": "{{preferred_modes}}",
    "preferred_price_range": "{{preferred_price_range}}",
    "preferred_time_slots": "{{preferred_time_slots}}",
    "assigned_therapist_name": "{{assigned_therapist_name}}",
    "chatbot_booking_explained": {{chatbot_booking_explained}},
    "clinical_concerns_mentioned": {{clinical_concerns_mentioned}},
    "clinical_concerns_details": "{{clinical_concerns_details}}",
    "suicidal_thoughts_mentioned": {{suicidal_thoughts_mentioned}},
    "suicidal_thoughts_details": "{{suicidal_thoughts_details}}",
    "other_notes": "{{other_notes}}"
  }
}
```

---

## 📋 FORM 2: THERAPY DOCUMENTATION SHEET

### **Webhook URL:**
```
POST /api/paperform-webhook/therapy-documentation
```

### **Hidden Fields (Prefilled by URL):**
- `booking_id` - From URL parameter
- `submission_id` - Paperform's submission ID
- `client_id` - From URL parameter
- `client_name` - From URL parameter
- `session_number` - From URL parameter or calculated

### **Section A: Session Basics (Prefilled)**

| Form Field Label | JSON Key | Type | Required |
|-----------------|----------|------|----------|
| Client Name | `client_name` | text | Yes |
| Client ID | `client_id` | text | Yes |
| Date | `session_date` | date | Yes |
| Session Start Time - End Time | `session_timing` | text | Yes |
| Session Duration | `session_duration` | text | Yes |
| Therapist Name | `therapist_name` | text | Yes |
| Mode of Session | `session_mode` | dropdown | Yes |
| Session Number | `session_number` | number | Yes |

### **Section B: Case History (First Session Only)**

All fields go under `data.case_history` object:

| Form Field Label | JSON Key | Database Column | Type |
|-----------------|----------|-----------------|------|
| Full Name (First & Last) | `full_name` | `client_name` | text |
| Age | `age` | `age` | number |
| Gender Identity | `gender_identity` | `gender_identity` | text |
| Education | `education` | `education` | text |
| Occupation | `occupation` | `occupation` | text |
| Primary Income Source(s) | `primary_income` | `primary_income` | text |
| Marital Status | `marital_status` | `marital_status` | text |
| Children | `children` | `children` | text |
| Religion / Cultural Background | `religion` | `religion` | text |
| Socio‑Economic Status | `socio_economic_status` | `socio_economic_status` | text |
| City & State | `city_state` | `city_state` | text |
| Presenting concern(s) | `presenting_concerns` | `presenting_concerns` | textarea |
| Duration & onset | `duration_onset` | `duration_onset` | textarea |
| Any triggers or maintaining factors | `triggers_factors` | `triggers_factors` | textarea |
| Sleep | `sleep` | `sleep` | dropdown |
| Appetite | `appetite` | `appetite` | dropdown |
| Energy Levels | `energy_levels` | `energy_levels` | dropdown |
| Weight Changes | `weight_changes` | `weight_changes` | dropdown |
| Libido | `libido` | `libido` | text |
| Menstrual History | `menstrual_history` | `menstrual_history` | text |
| Family History & Genogram | `family_history` | `family_history` | textarea |
| Genogram Upload | `genogram_url` | `genogram_url` | file_url |
| Developmental History | `developmental_history` | `developmental_history` | textarea |
| Medical History | `medical_history` | `medical_history` | textarea |
| Medications | `medications` | `medications` | textarea |
| Previous Mental Health History | `previous_mental_health` | `previous_mental_health` | textarea |
| Insight | `insight_level` | `insight_level` | dropdown |

### **Section C: Goal Tracking**

All fields go under `data.therapy_goals` object:

| Form Field Label | JSON Key | Database Column | Type |
|-----------------|----------|-----------------|------|
| Therapy goals and expectations | `goal_description` | `goal_description` | textarea |
| Current stage of goals | `current_stage` | `current_stage` | dropdown |

**Current Stage Options:**
- Initiation
- In-progress
- Maintenance
- Review

### **Section D: Progress Notes (Every Session)**

All fields go under `data.progress_notes` object:

| Form Field Label | JSON Key | Database Column | Type |
|-----------------|----------|-----------------|------|
| What did the client bring up today? | `client_report` | `client_report` | textarea |
| Direct quotes | `direct_quotes` | `direct_quotes` | textarea |
| How did the client present today? | `client_presentation` | `client_presentation` | text |
| Presentation tags | `presentation_tags` | `presentation_tags` | array |
| Techniques/interventions used | `techniques_used` | `techniques_used` | textarea |
| Homework assigned | `homework_assigned` | `homework_assigned` | textarea |
| Client's reaction | `client_reaction` | `client_reaction` | text |
| Reaction tags | `reaction_tags` | `reaction_tags` | array |
| Engagement notes | `engagement_notes` | `engagement_notes` | textarea |
| Themes and patterns | `themes_patterns` | `themes_patterns` | textarea |
| Progress/regression | `progress_regression` | `progress_regression` | textarea |
| Clinical concerns | `clinical_concerns` | `clinical_concerns` | textarea |
| Any mention of self-harm | `self_harm_mention` | `self_harm_mention` | boolean |
| Self-harm details | `self_harm_details` | `self_harm_details` | textarea |
| Current Risk Level | `risk_level` | `risk_level` | dropdown |
| Risk Factors | `risk_factors` | `risk_factors` | textarea |
| Protective Factors | `protective_factors` | `protective_factors` | textarea |
| Safety Plan | `safety_plan` | `safety_plan` | textarea |
| Future interventions | `future_interventions` | `future_interventions` | textarea |
| Frequency of sessions | `session_frequency` | `session_frequency` | dropdown |

**Risk Level Options:**
- None
- Low
- Moderate
- High

**Session Frequency Options:**
- Weekly
- Bi-weekly
- Monthly
- As needed

### **Section E: Therapist Declaration**

| Form Field Label | JSON Key | Type |
|-----------------|----------|------|
| Therapist Signature | `therapist_signature` | text |
| Date | `signature_date` | date |

### **Example Paperform Webhook Payload:**
```json
{
  "submission_id": "{{submission_id}}",
  "booking_id": "{{booking_id}}",
  "data": {
    "client_id": "{{client_id}}",
    "client_name": "{{client_name}}",
    "session_date": "{{session_date}}",
    "session_duration": "{{session_duration}}",
    "session_mode": "{{session_mode}}",
    "session_number": {{session_number}},
    "therapist_name": "{{therapist_name}}",
    "therapist_signature": "{{therapist_signature}}",
    "signature_date": "{{signature_date}}",
    
    "case_history": {
      "age": {{age}},
      "gender_identity": "{{gender_identity}}",
      "education": "{{education}}",
      "occupation": "{{occupation}}",
      "primary_income": "{{primary_income}}",
      "marital_status": "{{marital_status}}",
      "children": "{{children}}",
      "religion": "{{religion}}",
      "socio_economic_status": "{{socio_economic_status}}",
      "city_state": "{{city_state}}",
      "presenting_concerns": "{{presenting_concerns}}",
      "duration_onset": "{{duration_onset}}",
      "triggers_factors": "{{triggers_factors}}",
      "sleep": "{{sleep}}",
      "appetite": "{{appetite}}",
      "energy_levels": "{{energy_levels}}",
      "weight_changes": "{{weight_changes}}",
      "libido": "{{libido}}",
      "menstrual_history": "{{menstrual_history}}",
      "family_history": "{{family_history}}",
      "genogram_url": "{{genogram_url}}",
      "developmental_history": "{{developmental_history}}",
      "medical_history": "{{medical_history}}",
      "medications": "{{medications}}",
      "previous_mental_health": "{{previous_mental_health}}",
      "insight_level": "{{insight_level}}"
    },
    
    "progress_notes": {
      "client_report": "{{client_report}}",
      "direct_quotes": "{{direct_quotes}}",
      "client_presentation": "{{client_presentation}}",
      "presentation_tags": [{{presentation_tags}}],
      "techniques_used": "{{techniques_used}}",
      "homework_assigned": "{{homework_assigned}}",
      "client_reaction": "{{client_reaction}}",
      "reaction_tags": [{{reaction_tags}}],
      "engagement_notes": "{{engagement_notes}}",
      "themes_patterns": "{{themes_patterns}}",
      "progress_regression": "{{progress_regression}}",
      "clinical_concerns": "{{clinical_concerns}}",
      "self_harm_mention": {{self_harm_mention}},
      "self_harm_details": "{{self_harm_details}}",
      "risk_level": "{{risk_level}}",
      "risk_factors": "{{risk_factors}}",
      "protective_factors": "{{protective_factors}}",
      "safety_plan": "{{safety_plan}}",
      "future_interventions": "{{future_interventions}}",
      "session_frequency": "{{session_frequency}}"
    },
    
    "therapy_goals": {
      "goal_description": "{{goal_description}}",
      "current_stage": "{{current_stage}}"
    }
  }
}
```

---

## 🔧 PAPERFORM CONFIGURATION TIPS

### **1. Conditional Logic for First Session**

Use Paperform's conditional logic to show/hide Section B (Case History) based on `session_number`:

- If `session_number = 1` → Show Section B
- If `session_number > 1` → Hide Section B

### **2. Prefilling Fields**

Add URL parameters when generating the link:

```
https://paperform.co/your-form?booking_id=685118&client_id=CL001&client_name=John+Doe&session_number=1
```

### **3. Array Fields**

For fields like `presentation_tags` and `reaction_tags`, use Paperform's multiple choice fields and map them as arrays in the webhook.

### **4. Boolean Fields**

For yes/no questions, use Paperform's radio buttons or checkboxes and map to `true`/`false` in the webhook.

### **5. File Uploads**

For `genogram_url`, use Paperform's file upload field. The webhook will receive the file URL.

---

## ✅ VALIDATION CHECKLIST

Before going live, verify:

- [ ] All required fields are marked as required in Paperform
- [ ] Webhook URL is correct (https, not http)
- [ ] Hidden fields are properly prefilled
- [ ] Conditional logic works for first vs follow-up sessions
- [ ] Array fields are properly formatted
- [ ] Boolean fields return true/false (not "Yes"/"No")
- [ ] Date fields are in correct format (YYYY-MM-DD)
- [ ] Test submission works end-to-end
- [ ] Data appears correctly in database
- [ ] UI displays data correctly

---

**Last Updated:** February 16, 2026
