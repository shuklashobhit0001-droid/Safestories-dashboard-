# Current SOS Alert Workflow

## When SOS is Triggered (by Therapist)

### Current Flow:

1. **Therapist submits SOS from TherapistDashboard**
   - Fills out risk assessment form with:
     - Risk severity level (1-5)
     - Risk indicators (emotional dysregulation, physical harm ideas, etc.)
     - Risk summary
     - Other details

2. **Data saved to database** (`sos_risk_assessments` table)
   - Stores all risk assessment data
   - Returns assessment ID
   - **Critical step** - must succeed

3. **Webhook sent to N8N** (non-critical)
   - URL: `https://n8n.srv1169280.hstgr.cloud/webhook/3e725c04-ed19-4967-8a05-c0a1e8c8441d`
   - Sends complete assessment data
   - Updates database with webhook status

4. **Audit log created** (non-critical)
   - Action type: `raise_sos`
   - Records therapist action

5. **Admin notifications created** (non-critical)
   - Notification type: `sos_ticket`
   - Title: "SOS Risk Assessment Submitted"
   - Message: Basic info about therapist and client
   - Sent to all admins

## Current Data Available in SOS Assessment:

From `sos_risk_assessments` table:
- `booking_id` - Related booking
- `therapist_id` - Therapist who raised SOS
- `therapist_name` - Therapist name
- `client_name` - Client name
- `session_name` - Type of session
- `session_timings` - When session occurred
- `contact_info` - Client contact (phone/email)
- `mode` - Session mode (online/offline)
- `risk_severity_level` (1-5)
- `risk_severity_description`
- Risk indicators (11 different types)
- `risk_summary` - Therapist's summary
- `other_details`
- Timestamps: `created_at`, `updated_at`, `reviewed_at`
- Status tracking: `status`, `reviewed_by`, `resolution_notes`
- Webhook tracking: `webhook_sent`, `webhook_response`

## What's Missing for the Detailed Alert Message:

The alert message template requires:
- ✅ Client Name - Available
- ✅ Client Phone Number - Available (in contact_info)
- ✅ Therapist Name - Available
- ✅ Last Session Date & Time - Available (session_timings)
- ✅ Mode of Session - Available
- ❌ **Number of sessions** - NOT currently stored in SOS table
- ❌ **Emergency Contact Name & Phone Number** - NOT currently stored
- ✅ Risk Severity (1-5) - Available
- ✅ Current Risk Indicators - Available
- ✅ Risk summary - Available
- ❌ **Link to client's documentation profile** - Need to generate

## Proposed Implementation:

### Option 1: Enhance SOS Data Collection
When SOS is raised, fetch additional data:
1. Query bookings table to get total session count for client
2. Extract emergency contact from `invitee_questions_and_answers` in bookings
3. Generate link to client profile: `/client-profile?email={email}&phone={phone}`

### Option 2: Email Template with N8N
Send the formatted email via N8N webhook with all required data:
- N8N receives SOS webhook
- N8N formats the email template
- N8N sends email to admin(s)
- Email includes all client details and risk assessment

### Recommended Approach:
**Combine both options:**
1. Enhance the SOS submission to include:
   - Session count (query from bookings)
   - Emergency contact (extract from bookings)
   - Client profile link
2. Send enhanced data to N8N webhook
3. N8N formats and sends the detailed alert email
4. Also create in-app notification for admins with same details

## Next Steps:

1. Update TherapistDashboard SOS submission to fetch:
   - Total session count for client
   - Emergency contact info
   
2. Update N8N webhook payload to include all required fields

3. Create email template in N8N with the exact format specified

4. Optionally: Create a dedicated SOS alerts view in admin dashboard

Should I proceed with implementing this?
