# Testing SOS Documentation Link System

## Prerequisites
- ✅ Database table created (`sos_access_tokens`)
- ✅ Server running on port 3004
- ✅ Frontend compiled and running

## Method 1: Manual Testing (Full Flow)

### Step 1: Start the Server
```bash
npm run dev
```
Server should start on `http://localhost:3004`

### Step 2: Login as Therapist
1. Open browser: `http://localhost:3004`
2. Login with therapist credentials
3. You should see the Therapist Dashboard

### Step 3: Raise an SOS
1. Go to "Appointments" tab
2. Find a completed session
3. Click "Raise SOS" button
4. Fill out the risk assessment form:
   - Select risk severity (1-5)
   - Check relevant risk indicators
   - Write risk summary
   - Type "CONFIRM" in the confirmation box
5. Click "Submit SOS Assessment"

### Step 4: Check Console for Generated Link
Open browser console (F12) and look for:
```
✅ SOS assessment saved to database with ID: 123
✅ Documentation link generated: http://localhost:3004/sos-view/a1b2c3d4-...
```

### Step 5: Test the Documentation Link
1. Copy the generated link from console
2. Open in a NEW BROWSER TAB (or incognito window)
3. You should see the SOS Documentation View with:
   - Client information
   - Risk assessment details
   - Case history
   - Progress notes
   - Therapy goals

### Step 6: Verify Access Tracking
1. Refresh the documentation link page
2. Check that "access count" increases
3. The first access should set "accessed_at" timestamp

---

## Method 2: API Testing (Quick Test)

### Test 1: Generate Token Manually
```bash
curl -X POST http://localhost:3004/api/generate-sos-token \
  -H "Content-Type: application/json" \
  -d '{
    "sos_assessment_id": 1,
    "client_email": "test@example.com",
    "client_phone": "+1234567890",
    "client_name": "Test Client",
    "expires_in_days": 7
  }'
```

Expected response:
```json
{
  "success": true,
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expires_at": "2026-02-23T...",
  "message": "SOS access token generated successfully"
}
```

### Test 2: Access Documentation with Token
```bash
curl http://localhost:3004/api/sos-documentation?token=YOUR_TOKEN_HERE
```

Expected response:
```json
{
  "success": true,
  "client": {
    "name": "Test Client",
    "email": "test@example.com",
    "phone": "+1234567890",
    "session_count": 5,
    "emergency_contact": "..."
  },
  "sos_assessment": {...},
  "documentation": {
    "case_history": [...],
    "progress_notes": [...],
    "therapy_goals": [...]
  },
  "token_info": {...}
}
```

---

## Method 3: Automated Test Script

Run the test script:
```bash
npx tsx test_sos_documentation_system.ts
```

This will:
1. Check if table exists
2. Create a test token
3. Verify token can be retrieved
4. Test access tracking
5. Test expiration validation
6. Clean up test data

---

## What to Check

### ✅ Token Generation:
- [ ] Token is UUID format
- [ ] Token is stored in database
- [ ] Expiration date is set correctly (7 days from now)
- [ ] Link format is correct: `/sos-view/{token}`

### ✅ Documentation View:
- [ ] Page loads without login
- [ ] Client information displays correctly
- [ ] Risk assessment shows with correct severity color
- [ ] Case history appears (if exists)
- [ ] Progress notes are listed chronologically
- [ ] Therapy goals show with status
- [ ] Access count displays at bottom

### ✅ Security:
- [ ] Invalid token shows error message
- [ ] Expired token shows "link has expired"
- [ ] Revoked token shows "link has been revoked"
- [ ] Access is logged in database

### ✅ Integration:
- [ ] SOS submission generates token
- [ ] Token is included in webhook payload
- [ ] Console shows documentation link
- [ ] Link works immediately after generation

---

## Troubleshooting

### Issue: "Token is required" error
**Solution:** Make sure token is in URL: `/sos-view/{token}`

### Issue: "Invalid or expired token"
**Possible causes:**
1. Token doesn't exist in database
2. Token has expired
3. Token was revoked
**Check:** Query database to verify token exists

### Issue: Documentation page is blank
**Possible causes:**
1. No documentation exists for client
2. Client email/phone mismatch
**Check:** Verify client has case history or progress notes

### Issue: "Failed to fetch documentation"
**Possible causes:**
1. Server not running
2. Database connection issue
3. API endpoint not registered
**Check:** Server logs for errors

### Issue: Link not generated during SOS submission
**Possible causes:**
1. Token generation endpoint failed
2. SOS assessment ID not returned
**Check:** Browser console for errors

---

## Database Queries for Verification

### Check tokens in database:
```sql
SELECT * FROM sos_access_tokens ORDER BY created_at DESC LIMIT 5;
```

### Check token details:
```sql
SELECT 
  token,
  client_name,
  created_at,
  expires_at,
  accessed_at,
  access_count,
  is_active
FROM sos_access_tokens
WHERE token = 'YOUR_TOKEN_HERE';
```

### Check SOS assessments:
```sql
SELECT * FROM sos_risk_assessments ORDER BY created_at DESC LIMIT 5;
```

### Update token expiration (for testing):
```sql
UPDATE sos_access_tokens 
SET expires_at = NOW() + INTERVAL '7 days'
WHERE token = 'YOUR_TOKEN_HERE';
```

### Revoke a token:
```sql
UPDATE sos_access_tokens 
SET is_active = false, revoked_at = NOW(), revoked_by = 'admin'
WHERE token = 'YOUR_TOKEN_HERE';
```

---

## Expected Console Output

When SOS is submitted successfully:
```
✅ SOS assessment saved to database with ID: 123
✅ Documentation link generated: http://localhost:3004/sos-view/a1b2c3d4-e5f6-7890-abcd-ef1234567890
✅ Webhook sent successfully
✅ Audit log created
✅ Admin notifications sent
```

---

## Next Steps After Testing

1. ✅ Verify token generation works
2. ✅ Verify documentation view displays correctly
3. ✅ Test with real client data
4. ✅ Update N8N webhook to include documentation_link
5. ✅ Create email template with link
6. ✅ Test end-to-end flow
7. ✅ Deploy to production
