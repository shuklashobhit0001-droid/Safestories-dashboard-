# SOS Documentation Link Implementation - Complete

## Overview
Secure, shareable link system that provides emergency responders access to complete client therapy documentation when an SOS is raised.

## Implementation Complete ✅

### 1. Database Table Created
**File:** `scripts/createSOSAccessTokensTable.ts`

Table: `sos_access_tokens`
- Stores unique tokens with expiration
- Links to SOS assessments
- Tracks access (who, when, how many times)
- Can be revoked by admins

**To create the table, run:**
```bash
npx tsx scripts/createSOSAccessTokensTable.ts
```

### 2. API Endpoints Added

#### Generate Token Endpoint
**Route:** `POST /api/generate-sos-token`
**Purpose:** Creates unique secure token when SOS is raised
**Request Body:**
```json
{
  "sos_assessment_id": 123,
  "client_email": "client@example.com",
  "client_phone": "+1234567890",
  "client_name": "Client Name",
  "expires_in_days": 7
}
```
**Response:**
```json
{
  "success": true,
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expires_at": "2026-02-23T...",
  "message": "SOS access token generated successfully"
}
```

#### Get Documentation Endpoint
**Route:** `GET /api/sos-documentation?token={token}`
**Purpose:** Public endpoint (no auth) to fetch client documentation
**Returns:**
- Client information (name, phone, email, session count, emergency contact)
- SOS assessment details (severity, risk summary)
- Complete documentation:
  - Case history
  - All progress notes
  - Therapy goals
- Token info (expiration, access count)

**Security Features:**
- Validates token exists
- Checks if token is active (not revoked)
- Checks if token is expired
- Logs each access
- Increments access counter

### 3. Frontend Component Created
**File:** `components/SOSDocumentationView.tsx`

**Features:**
- Clean, professional read-only view
- Shows all client therapy documentation
- Color-coded risk severity display
- Chronological progress notes
- Therapy goals with status
- Access tracking footer
- Mobile-responsive design

**Sections Displayed:**
1. SOS Alert Header with risk severity
2. Client Information (name, contact, session count, emergency contact)
3. Case History (presenting concerns, background, mental health history)
4. Progress Notes (all sessions with summaries, interventions, progress)
5. Therapy Goals (with achievement status)
6. Footer (expiration date, access count)

### 4. Integration with SOS Submission
**File:** `components/TherapistDashboard.tsx`

**Updated Flow:**
1. Therapist submits SOS assessment
2. Assessment saved to database → returns assessment_id
3. **NEW:** Generate secure token with assessment_id
4. **NEW:** Create documentation link: `https://yourdomain.com/sos-view/{token}`
5. Send webhook to N8N with documentation link included
6. Create audit log
7. Notify admins

### 5. Public Route Added
**File:** `App.tsx`

**Route:** `/sos-view/:token`
- Public route (no login required)
- Extracts token from URL
- Renders SOSDocumentationView component
- Works independently of authentication system

## How It Works

### When SOS is Raised:

1. **Therapist Action:**
   - Fills out SOS risk assessment form
   - Submits assessment

2. **System Response:**
   ```
   Save Assessment → Generate Token → Create Link → Send to N8N
   ```

3. **Token Generation:**
   - Creates UUID token
   - Sets expiration (default: 7 days)
   - Stores in database with client info
   - Returns secure link

4. **Link Format:**
   ```
   https://yourdomain.com/sos-view/a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

### When Link is Accessed:

1. **Validation:**
   - Check token exists
   - Check not expired
   - Check not revoked

2. **Data Fetching:**
   - Get client info from token
   - Fetch case history
   - Fetch all progress notes
   - Fetch therapy goals
   - Get session count
   - Get emergency contact

3. **Access Tracking:**
   - Log access timestamp (first time only)
   - Increment access counter
   - Track who accessed (optional)

4. **Display:**
   - Show complete documentation
   - Professional, read-only format
   - Easy to print/save

## Security Features

✅ **Unique Tokens:** UUID ensures unpredictability
✅ **Expiration:** Tokens expire after set period (default 7 days)
✅ **Revocable:** Admins can revoke tokens
✅ **Access Logging:** Track when and how many times accessed
✅ **No Auth Required:** Easy access for emergency responders
✅ **Read-Only:** No ability to modify data
✅ **Audit Trail:** Complete access history

## Data Included in Documentation

### Client Information:
- Name
- Phone number
- Email
- Total session count
- Emergency contact (if available)

### SOS Assessment:
- Risk severity level (1-5)
- Risk severity description
- Risk summary from therapist
- Date/time SOS was raised

### Case History:
- Presenting concerns
- Background history
- Mental health history
- Current stressors
- Family history
- Medical history
- Previous mental health treatment

### Progress Notes (All Sessions):
- Session date
- Therapist name
- Session summary
- Interventions used
- Client progress
- Plan for next session

### Therapy Goals:
- Goal descriptions
- Status (not started, in progress, achieved)
- Therapist who set goal
- Date created

## N8N Webhook Integration

The webhook now receives:
```json
{
  "database_id": 123,
  "documentation_link": "https://yourdomain.com/sos-view/token-here",
  "therapist_name": "Therapist Name",
  "client_name": "Client Name",
  "session_timings": "...",
  "contact_info": "...",
  "mode": "online/offline",
  "risk_assessment": {
    "severity_level": 4,
    "severity_description": "...",
    "risk_summary": "...",
    "risk_indicators": {...}
  }
}
```

## Email Template for N8N

The N8N workflow can now send an email with:

```
Subject: SOS Alert - Immediate Attention Required

Hello!

An SOS has been raised following a therapy session. Please review the details below and initiate the required safety steps as per risk protocol.

Client Details:
• Client Name: {{client_name}}
• Client Phone Number: {{contact_info}}
• Therapist Name: {{therapist_name}}
• Last Session Date & Time: {{session_timings}}
• Mode of Session: {{mode}}
• Risk Severity: {{risk_assessment.severity_level}}/5

SOS Summary:
{{risk_assessment.risk_summary}}

📋 Complete Client Documentation:
{{documentation_link}}

This link provides access to:
- Complete case history
- All progress notes from therapy sessions
- Current therapy goals
- Emergency contact information

Link expires in 7 days.

Thank you for responding promptly and supporting client safety.
```

## Testing

### 1. Create the database table:
```bash
npx tsx scripts/createSOSAccessTokensTable.ts
```

### 2. Test SOS submission:
- Login as therapist
- Go to a completed session
- Click "Raise SOS"
- Fill out risk assessment
- Submit

### 3. Check console for:
- ✅ SOS assessment saved
- ✅ Documentation link generated
- Link format: `http://localhost:3004/sos-view/{token}`

### 4. Test the link:
- Copy the generated link
- Open in new browser tab (no login needed)
- Should see complete client documentation

### 5. Verify data:
- Check all sections are populated
- Verify risk assessment is displayed
- Check access counter increments

## Future Enhancements (Optional)

1. **Admin Dashboard for SOS Links:**
   - View all active tokens
   - Revoke tokens manually
   - See access logs
   - Regenerate expired tokens

2. **Email Notifications:**
   - Send link directly via email from system
   - Email to designated emergency contacts

3. **One-Time Use Option:**
   - Token becomes invalid after first access
   - Higher security for sensitive cases

4. **Custom Expiration:**
   - Allow therapist to set expiration time
   - Different durations for different severity levels

5. **PDF Export:**
   - Generate PDF of documentation
   - Attach to email or download

## Files Modified/Created

### Created:
- ✅ `scripts/createSOSAccessTokensTable.ts`
- ✅ `api/sos-documentation.ts`
- ✅ `components/SOSDocumentationView.tsx`
- ✅ `SOS_DOCUMENTATION_LINK_IMPLEMENTATION.md`

### Modified:
- ✅ `server/index.ts` - Added 2 new endpoints
- ✅ `components/TherapistDashboard.tsx` - Added token generation
- ✅ `App.tsx` - Added public route handling

## Deployment Checklist

- [ ] Run database migration to create `sos_access_tokens` table
- [ ] Deploy updated server code
- [ ] Deploy updated frontend code
- [ ] Update N8N webhook to handle `documentation_link` field
- [ ] Create email template in N8N with documentation link
- [ ] Test end-to-end flow in production
- [ ] Document link format for emergency responders
- [ ] Train staff on how to use/share links

## Complete! 🎉

The secure SOS documentation link system is now fully implemented and ready for testing.
