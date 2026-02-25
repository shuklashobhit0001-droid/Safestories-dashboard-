# 🚨 SOS Webhook - Current Data Being Sent

## 📍 Webhook URL
```
https://n8n.srv1169280.hstgr.cloud/webhook/3e725c04-ed19-4967-8a05-c0a1e8c8441d
```

**Method:** POST  
**Content-Type:** application/json

---

## 📦 Current Webhook Payload

### Complete JSON Structure:
```json
{
  "database_id": 123,
  "documentation_link": "https://your-domain.com/sos-view/abc123token",
  "therapist_id": 456,
  "therapist_name": "Dr. Smith",
  "client_name": "John Doe",
  "session_name": "Individual Therapy",
  "session_timings": "2025-02-19 14:00:00",
  "contact_info": "+91 9876543210",
  "mode": "online",
  "booking_id": 789,
  "timestamp": "2025-02-19T08:30:00.000Z",
  "risk_assessment": {
    "severity_level": 4,
    "severity_description": "High Risk",
    "risk_indicators": {
      "emotionalDysregulation": "Severe mood swings",
      "physicalHarmIdeas": "Expressed thoughts of self-harm",
      "drugAlcoholAbuse": null,
      "suicidalAttempt": "Previous attempt mentioned",
      "selfHarm": "Recent cutting behavior",
      "delusionsHallucinations": null,
      "impulsiveness": "Acting without thinking",
      "severeStress": "Overwhelming stress from work",
      "socialIsolation": "Withdrawn from friends",
      "concernByOthers": "Family expressed concern",
      "other": null
    },
    "other_details": "Additional context about the situation",
    "risk_summary": "Client showing multiple high-risk indicators requiring immediate attention"
  }
}
```

---

## 📋 Field-by-Field Breakdown

### 1. Database & System Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `database_id` | Integer | SOS assessment ID from database | `123` |
| `documentation_link` | String (URL) | Link to view full SOS documentation | `https://domain.com/sos-view/token` |
| `timestamp` | String (ISO 8601) | When SOS was submitted | `2025-02-19T08:30:00.000Z` |
| `booking_id` | Integer | Related booking/session ID | `789` |

### 2. Therapist Information

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `therapist_id` | Integer | Therapist's database ID | `456` |
| `therapist_name` | String | Therapist's username/name | `Dr. Smith` |

### 3. Client Information

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `client_name` | String | Client's full name | `John Doe` |
| `contact_info` | String | Client's phone or email | `+91 9876543210` or `email@example.com` |

### 4. Session Information

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `session_name` | String | Type of therapy session | `Individual Therapy` |
| `session_timings` | String | When session occurred | `2025-02-19 14:00:00` |
| `mode` | String | Session mode | `online` or `offline` |

### 5. Risk Assessment Object

#### Main Risk Fields:
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `severity_level` | Integer (1-5) | Risk severity rating | `4` |
| `severity_description` | String | Description of severity | `High Risk` |
| `risk_summary` | String | Therapist's summary | `Client showing multiple high-risk indicators...` |
| `other_details` | String | Additional context | `Additional notes about situation` |

#### Risk Indicators (all optional):
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `emotionalDysregulation` | String/null | Emotional regulation issues | `Severe mood swings` |
| `physicalHarmIdeas` | String/null | Thoughts of physical harm | `Expressed thoughts of self-harm` |
| `drugAlcoholAbuse` | String/null | Substance abuse issues | `Daily alcohol consumption` |
| `suicidalAttempt` | String/null | Suicidal ideation/attempts | `Previous attempt mentioned` |
| `selfHarm` | String/null | Self-harm behavior | `Recent cutting behavior` |
| `delusionsHallucinations` | String/null | Psychotic symptoms | `Hearing voices` |
| `impulsiveness` | String/null | Impulsive behavior | `Acting without thinking` |
| `severeStress` | String/null | Stress levels | `Overwhelming stress from work` |
| `socialIsolation` | String/null | Social withdrawal | `Withdrawn from friends` |
| `concernByOthers` | String/null | Others' concerns | `Family expressed concern` |
| `other` | String/null | Other risk factors | `Any other concerns` |

---

## 🔍 What's Available vs What's Missing

### ✅ Currently Available in Webhook:

1. **Client Information:**
   - ✅ Client Name
   - ✅ Client Phone/Email (in `contact_info`)
   
2. **Therapist Information:**
   - ✅ Therapist Name
   - ✅ Therapist ID

3. **Session Information:**
   - ✅ Last Session Date & Time
   - ✅ Mode of Session (online/offline)
   - ✅ Session Type

4. **Risk Assessment:**
   - ✅ Risk Severity (1-5)
   - ✅ All 11 Risk Indicators
   - ✅ Risk Summary
   - ✅ Additional Details

5. **System Information:**
   - ✅ Database ID
   - ✅ Documentation Link
   - ✅ Timestamp

### ❌ NOT Currently Available:

1. **Client History:**
   - ❌ Number of sessions completed
   - ❌ Total sessions booked
   - ❌ First session date

2. **Emergency Contact:**
   - ❌ Emergency contact name
   - ❌ Emergency contact phone number
   - ❌ Emergency contact relationship

3. **Additional Client Details:**
   - ❌ Client email (if contact_info is phone)
   - ❌ Client age
   - ❌ Client address

---

## 📊 Example Real Webhook Payload

### Scenario: High-Risk Client Assessment

```json
{
  "database_id": 42,
  "documentation_link": "https://safestories.com/sos-view/a1b2c3d4e5f6",
  "therapist_id": 15,
  "therapist_name": "Dr. Sarah Johnson",
  "client_name": "Priya Sharma",
  "session_name": "Individual Therapy",
  "session_timings": "2025-02-19 15:30:00",
  "contact_info": "+91 9876543210",
  "mode": "online",
  "booking_id": 1234,
  "timestamp": "2025-02-19T10:00:00.000Z",
  "risk_assessment": {
    "severity_level": 5,
    "severity_description": "Critical Risk",
    "risk_indicators": {
      "emotionalDysregulation": "Extreme emotional instability, crying uncontrollably",
      "physicalHarmIdeas": "Active thoughts of ending life",
      "drugAlcoholAbuse": null,
      "suicidalAttempt": "Attempted suicide 2 weeks ago",
      "selfHarm": "Multiple fresh cuts on arms",
      "delusionsHallucinations": null,
      "impulsiveness": "Made impulsive decision to quit job",
      "severeStress": "Overwhelming stress from family issues",
      "socialIsolation": "Stopped answering calls, isolated for 3 days",
      "concernByOthers": "Mother called expressing serious concern",
      "other": "Lost significant weight, not eating properly"
    },
    "other_details": "Client mentioned having a plan. Immediate intervention required. Family has been notified.",
    "risk_summary": "CRITICAL: Client presenting with active suicidal ideation, recent attempt, and current plan. Multiple high-risk indicators present. Requires immediate psychiatric evaluation and possible hospitalization. Family support system engaged."
  }
}
```

---

## 🔄 Webhook Flow

### When SOS is Submitted:

```
1. Therapist fills SOS form in dashboard
   ↓
2. Data saved to database (sos_risk_assessments table)
   ↓
3. Assessment ID generated (e.g., 42)
   ↓
4. Documentation token generated
   ↓
5. Documentation link created
   ↓
6. Webhook payload assembled
   ↓
7. POST request sent to N8N webhook
   ↓
8. Database updated with webhook status
   ↓
9. Audit log created
   ↓
10. Admin notifications sent
```

---

## 🎯 N8N Webhook Receives:

### What N8N Can Do With This Data:

1. **Send Email Alerts:**
   - To admin team
   - To emergency contacts (if added)
   - To on-call therapist

2. **Create Tickets:**
   - In ticketing system
   - In CRM
   - In case management system

3. **Trigger Workflows:**
   - Escalation workflows based on severity
   - Notification workflows
   - Follow-up reminders

4. **Store Data:**
   - In external database
   - In Google Sheets
   - In data warehouse

5. **Generate Reports:**
   - Risk assessment reports
   - Trend analysis
   - Compliance documentation

---

## 📧 Example Email Template (N8N Can Generate)

```
Subject: 🚨 URGENT: SOS Risk Assessment - Priya Sharma (Severity: 5)

CRITICAL SOS ALERT

Client Information:
- Name: Priya Sharma
- Contact: +91 9876543210
- Last Session: 2025-02-19 15:30:00
- Mode: Online

Therapist Information:
- Name: Dr. Sarah Johnson
- ID: 15

Risk Assessment:
- Severity Level: 5 (Critical Risk)
- Assessment ID: 42

Risk Indicators Present:
✓ Emotional Dysregulation: Extreme emotional instability
✓ Physical Harm Ideas: Active thoughts of ending life
✓ Suicidal Attempt: Attempted suicide 2 weeks ago
✓ Self Harm: Multiple fresh cuts on arms
✓ Impulsiveness: Made impulsive decision to quit job
✓ Severe Stress: Overwhelming stress from family issues
✓ Social Isolation: Stopped answering calls, isolated for 3 days
✓ Concern By Others: Mother called expressing serious concern
✓ Other: Lost significant weight, not eating properly

Risk Summary:
CRITICAL: Client presenting with active suicidal ideation, recent 
attempt, and current plan. Multiple high-risk indicators present. 
Requires immediate psychiatric evaluation and possible hospitalization. 
Family support system engaged.

Additional Details:
Client mentioned having a plan. Immediate intervention required. 
Family has been notified.

View Full Documentation:
https://safestories.com/sos-view/a1b2c3d4e5f6

Submitted: 2025-02-19 10:00:00 UTC

ACTION REQUIRED: Immediate follow-up needed.
```

---

## 🔐 Security & Privacy

### Data Handling:
- ✅ Webhook uses HTTPS
- ✅ Sensitive data included (necessary for emergency response)
- ✅ Documentation link has token-based access
- ✅ Token expires after 7 days
- ⚠️ No authentication on webhook (N8N handles this)

### Recommendations:
1. Add webhook authentication header
2. Encrypt sensitive fields
3. Log all webhook calls
4. Monitor for failed webhooks
5. Set up retry mechanism

---

## 📝 Database Tracking

### Webhook Status Stored:
```sql
UPDATE sos_risk_assessments 
SET 
  webhook_sent = true/false,
  webhook_response = 'Success' or 'Failed: 500'
WHERE id = assessment_id;
```

### You Can Query:
```sql
-- Check webhook success rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN webhook_sent = true THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN webhook_sent = false THEN 1 ELSE 0 END) as failed
FROM sos_risk_assessments;
```

---

## 🚀 Next Steps / Enhancements

### To Add More Data:

1. **Session Count:**
   ```typescript
   // Query before sending webhook
   const sessionCount = await pool.query(
     'SELECT COUNT(*) FROM bookings WHERE client_email = $1',
     [clientEmail]
   );
   webhookData.session_count = sessionCount.rows[0].count;
   ```

2. **Emergency Contact:**
   ```typescript
   // Extract from booking data
   const emergencyContact = extractEmergencyContact(booking.invitee_questions_and_answers);
   webhookData.emergency_contact = emergencyContact;
   ```

3. **Client Profile Link:**
   ```typescript
   webhookData.client_profile_link = `${window.location.origin}/client-profile?id=${clientId}`;
   ```

---

**Current Status:** ✅ Webhook is functional and sending comprehensive risk assessment data  
**Missing Data:** Session count, emergency contact details  
**Ready for:** N8N workflow configuration, email templates, escalation rules

