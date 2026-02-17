# Deployment Checklist - SOS Documentation Link & UI Updates

## 📋 Files to Push to Repository

### ✅ CRITICAL - Must Push (Core Functionality)

#### Frontend Components (Modified)
1. **App.tsx** - Added SOS documentation public route
2. **components/AllClients.tsx** - Added Pre-Therapy tab, renamed column to "No. of Bookings"
3. **components/TherapistDashboard.tsx** - Enhanced SOS submission with token generation
4. **components/SOSDocumentationView.tsx** - NEW: Public documentation view component

#### Backend/Server (Modified)
5. **server/index.ts** - Added SOS token generation and documentation endpoints
6. **api/index.ts** - Modified (check what changes)

#### API Endpoints (New)
7. **api/sos-documentation.ts** - NEW: Serverless function for documentation retrieval

#### Database Scripts (New)
8. **scripts/createSOSAccessTokensTable.ts** - NEW: Creates sos_access_tokens table

### ⚠️ OPTIONAL - Documentation & Admin Tools

#### Documentation Files (New)
9. **SOS_DOCUMENTATION_LINK_IMPLEMENTATION.md** - Complete implementation guide
10. **TEST_SOS_DOCUMENTATION_LINK.md** - Testing guide
11. **SOS_ALERT_CURRENT_WORKFLOW.md** - Workflow documentation

#### Admin Components (New)
12. **components/AdminNotifications.tsx** - Admin notification component
13. **components/EditTherapistForm.tsx** - Therapist editing form
14. **components/ViewTherapistModal.tsx** - Therapist view modal
15. **components/ConfirmModal.tsx** - Confirmation modal component

#### Other Modified Components
16. **components/AllTherapists.tsx** - Modified
17. **components/Appointments.tsx** - Modified
18. **components/ClientAppointments.tsx** - Modified
19. **components/ClientDashboard.tsx** - Modified
20. **components/Dashboard.tsx** - Modified
21. **components/TherapistDetailsModal.tsx** - Modified

### 🚫 DO NOT PUSH - Test/Debug Files

These are local testing files and should NOT be pushed:
- ❌ check_*.ts files (all check scripts)
- ❌ test_*.ts files (all test scripts)
- ❌ debug_*.ts files (all debug scripts)
- ❌ verify_*.ts files (all verification scripts)
- ❌ fix_*.ts files (all fix scripts)
- ❌ *_ANALYSIS.md files (analysis documents)
- ❌ *_STATUS.md files (status documents)

---

## 📦 What Each File Does

### Core SOS Documentation System:

**App.tsx**
- Adds public route `/sos-view/:token` for documentation access
- No authentication required for this route

**components/SOSDocumentationView.tsx**
- Displays complete client documentation
- Shows risk assessment, case history, progress notes, therapy goals
- Tracks access and shows expiration info

**components/TherapistDashboard.tsx**
- Generates secure token when SOS is raised
- Creates documentation link
- Sends link to N8N webhook

**server/index.ts**
- POST `/api/generate-sos-token` - Creates secure access token
- GET `/api/sos-documentation?token=X` - Retrieves documentation (public)

**api/sos-documentation.ts**
- Serverless function version of documentation endpoint
- For Vercel/Netlify deployment

**scripts/createSOSAccessTokensTable.ts**
- Creates `sos_access_tokens` database table
- Run once in production: `npx tsx scripts/createSOSAccessTokensTable.ts`

### UI Improvements:

**components/AllClients.tsx**
- Added "Pre-Therapy" tab (shows clients with Safestories as therapist)
- Renamed "No. of Sessions" to "No. of Bookings"
- Improved tab filtering logic

**components/AllTherapists.tsx**
- Fixed session type detection for client profiles
- Added error handling for /api/client-session-type
- Shows "Case History:" for paid sessions vs "Pre-therapy Notes:" for free consultations
- Proper tab visibility based on session type

**components/TherapistDashboard.tsx** (Already has the fix)
- Same session type detection as AllTherapists
- Error handling with fallback to paid session UI
- Debug logging for troubleshooting
- Conditional tab display based on session type

### Session Type Fix:
Both dashboards now correctly handle:
- ✅ Free Consultation clients → Show "Pre-therapy Notes:" with limited tabs
- ✅ Paid session clients → Show "Case History:" with all tabs
- ✅ Corrupted phone numbers fixed in database (11 records)
- ✅ API endpoint: `/api/client-session-type`

---

## 🚀 Deployment Steps

### 1. Database Migration (Production)
```bash
# SSH into production server or run remotely
npx tsx scripts/createSOSAccessTokensTable.ts
```

This creates the `sos_access_tokens` table with:
- Unique token storage
- Expiration tracking
- Access logging
- Revocation capability

**Note:** The corrupted phone numbers have already been fixed in the database (11 records updated). No additional database changes needed for the session type fix.

### 2. Push Code to Repository
```bash
# Add only the necessary files
git add App.tsx
git add components/AllClients.tsx
git add components/AllTherapists.tsx
git add components/TherapistDashboard.tsx
git add components/SOSDocumentationView.tsx
git add server/index.ts
git add api/sos-documentation.ts
git add scripts/createSOSAccessTokensTable.ts

# Optional: Add documentation
git add SOS_DOCUMENTATION_LINK_IMPLEMENTATION.md
git add TEST_SOS_DOCUMENTATION_LINK.md

# Optional: Add admin components if needed
git add components/AdminNotifications.tsx
git add components/EditTherapistForm.tsx
git add components/ViewTherapistModal.tsx
git add components/ConfirmModal.tsx

# Commit
git commit -m "feat: Add SOS documentation link system and UI improvements

- Add secure SOS documentation link generation
- Create public documentation view (no login required)
- Add Pre-Therapy tab to All Clients
- Rename 'No. of Sessions' to 'No. of Bookings'
- Fix session type detection in both dashboards
- Show 'Case History' vs 'Pre-therapy Notes' based on session type
- Add sos_access_tokens table for token management
- Implement 7-day expiring links with access tracking"

# Push
git push origin main
```

### 3. Update N8N Webhook (Production)
The webhook now receives a new field:
```json
{
  "documentation_link": "https://yourdomain.com/sos-view/{token}",
  ...
}
```

Update your N8N email template to include:
```
📋 Complete Client Documentation:
{{documentation_link}}

This link provides access to complete therapy history and expires in 7 days.
```

### 4. Verify Deployment
- [ ] Database table created successfully
- [ ] SOS submission generates token
- [ ] Documentation link works (test with a real SOS)
- [ ] Link expires after 7 days
- [ ] Access is tracked in database
- [ ] N8N receives documentation_link in webhook
- [ ] Pre-Therapy tab shows correct clients
- [ ] "No. of Bookings" column displays correctly

---

## 🔒 Security Notes

- ✅ Tokens are UUID (unpredictable)
- ✅ Tokens expire after 7 days
- ✅ Tokens can be revoked by admins
- ✅ Access is logged (timestamp, count)
- ✅ No authentication required (by design for emergency access)
- ✅ Read-only view (no data modification possible)

---

## 📊 Current Git Status

**Modified Files (11):**
- App.tsx
- api/index.ts
- components/AllClients.tsx ← Pre-Therapy tab + column rename
- components/AllTherapists.tsx ← Session type fix
- components/Appointments.tsx
- components/ClientAppointments.tsx
- components/ClientDashboard.tsx
- components/Dashboard.tsx
- components/TherapistDashboard.tsx ← Session type fix + SOS token generation
- components/TherapistDetailsModal.tsx
- server/index.ts ← SOS endpoints

**New Files (Critical - 4):**
- api/sos-documentation.ts
- components/SOSDocumentationView.tsx
- scripts/createSOSAccessTokensTable.ts
- components/ConfirmModal.tsx

**New Files (Admin Components - 3):**
- components/AdminNotifications.tsx
- components/EditTherapistForm.tsx
- components/ViewTherapistModal.tsx

**New Files (Documentation - 3):**
- SOS_DOCUMENTATION_LINK_IMPLEMENTATION.md
- TEST_SOS_DOCUMENTATION_LINK.md
- SOS_ALERT_CURRENT_WORKFLOW.md

**Test/Debug Files (DO NOT PUSH - 40+):**
- All check_*.ts files
- All test_*.ts files
- All debug_*.ts files
- All *_ANALYSIS.md files

---

## ⚡ Quick Push Command

```bash
# Push only critical files
git add App.tsx components/AllClients.tsx components/AllTherapists.tsx components/TherapistDashboard.tsx components/SOSDocumentationView.tsx server/index.ts api/sos-documentation.ts scripts/createSOSAccessTokensTable.ts

# Commit and push
git commit -m "feat: SOS documentation link system + UI improvements + session type fix"
git push origin main
```

---

## 🎯 Ready to Proceed?

Review the files above and confirm:
1. ✅ All critical files are listed
2. ✅ Test files are excluded
3. ✅ Database migration plan is clear
4. ✅ N8N update is documented

**Proceed with deployment?**
