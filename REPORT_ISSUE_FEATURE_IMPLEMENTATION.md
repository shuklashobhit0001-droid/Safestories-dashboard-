# Report an Issue Feature - Complete Implementation

## Overview
Added a "Report an Issue" feature that allows admin users to report bugs and issues directly from the application. The feature includes a full-page form view, file upload for screenshots, and database storage.

## Implementation Details

### 1. Database Table
**Table Name:** `report_issues`

**Schema:**
```sql
- id (serial primary key) - Auto-incrementing issue ID
- subject (text, required) - Brief summary of the issue
- component (text, required) - Component/section where issue occurred
- description (text, required) - Detailed description of the issue
- screenshot_url (text, nullable) - URL to uploaded screenshot
- reported_by (text, required) - Username/name of reporter
- user_role (text, required) - Role of reporter (Admin/Therapist)
- status (text, default 'open') - Issue status: 'open', 'in_progress', 'resolved'
- created_at (timestamp) - When issue was reported
- resolved_at (timestamp, nullable) - When issue was resolved
- notes (text, nullable) - Admin notes for tracking
```

**Indexes:**
- `idx_report_issues_status` - For filtering by status
- `idx_report_issues_created_at` - For sorting by date

### 2. Frontend Components

#### ReportIssuePage Component
**Location:** `components/ReportIssuePage.tsx`

**Type:** Full-page view (not a modal)

**Features:**
- Back button to return to dashboard
- Form with validation
- Subject input (required)
- Component dropdown (required) - Options: Dashboard, Clients, Therapists, Appointments, Calendar, Session Notes, Reports, Profile, Audit Logs, Other
- Description textarea (required, min 20 characters)
- Screenshot upload (optional, max 5MB, image files only)
- Screenshot preview with remove option
- Auto-filled reporter information
- Loading states during submission
- Success screen with Issue ID
- Auto-redirect to dashboard after 3 seconds on success

**Validation:**
- Subject: Required
- Component: Required (must select from dropdown)
- Description: Required, minimum 20 characters
- Screenshot: Optional, max 5MB, images only

**Success Message:**
```
Thank You for Reporting!
We've received your feedback and will look into it shortly.
Issue ID: #[ID]
```

### 3. Button Placement
**Location:** Admin Dashboard sidebar, between Notifications and Audit Logs

**Design:**
- Icon: AlertCircle (from lucide-react)
- Text: "Report an Issue"
- Hover effect: Gray background
- Active state: Teal background (#2D75795C)
- Accessible from all admin dashboard views

### 4. API Endpoints

#### POST /api/report-issue
**Purpose:** Submit a new issue report

**Request Body:**
```json
{
  "subject": "string",
  "component": "string",
  "description": "string",
  "screenshot_url": "string | null",
  "reported_by": "string",
  "user_role": "string"
}
```

**Response:**
```json
{
  "success": true,
  "issueId": 123
}
```

**Files Updated:**
- `api/index.ts` - Added endpoint
- `server/index.ts` - Added endpoint (synced)

#### POST /api/upload-file (Updated)
**Purpose:** Upload files to MinIO storage

**Changes:**
- Added support for 'issue-screenshots' folder
- Updated folder validation to include new folder type
- Updated TypeScript types

**Files Updated:**
- `api/index.ts`
- `server/index.ts`
- `lib/minio.ts` - Updated uploadFile function signature

### 5. File Storage
**Storage:** MinIO bucket `safestories-panel`
**Folder:** `issue-screenshots/`
**Naming:** `{timestamp}-{sanitized-filename}`
**Access:** Public URLs for viewing screenshots

### 6. User Experience Flow

1. Admin clicks "Report an Issue" button in sidebar
2. Full-page view opens with form
3. Admin fills in:
   - Subject (e.g., "Client stats showing incorrect count")
   - Component (e.g., "Dashboard")
   - Description (detailed explanation)
   - Screenshot (optional)
4. Screenshot preview shows if uploaded
5. Admin clicks "Submit Report"
6. Loading state shows "Submitting..."
7. Success screen appears with Issue ID
8. Auto-redirects to dashboard after 3 seconds
9. Issue is stored in database with status 'open'

### 7. Files Created
1. `scripts/createReportIssuesTable.ts` - Database table creation script
2. `components/ReportIssuePage.tsx` - Full-page component
3. `REPORT_ISSUE_FEATURE_IMPLEMENTATION.md` - This documentation

### 8. Files Modified
1. `components/Dashboard.tsx`
   - Added import for ReportIssuePage and AlertCircle icon
   - Added "Report an Issue" button in sidebar with active state
   - Added ReportIssuePage view rendering in main content area

2. `api/index.ts`
   - Updated upload-file endpoint to support 'issue-screenshots' folder
   - Added POST /api/report-issue endpoint

3. `server/index.ts`
   - Updated upload-file endpoint to support 'issue-screenshots' folder
   - Added POST /api/report-issue endpoint

4. `lib/minio.ts`
   - Updated uploadFile function to accept 'issue-screenshots' folder type

### 9. Database Status
✅ Table created successfully
✅ Indexes created successfully

### 10. Future Enhancements (Not Implemented)
- Admin view to see all reported issues
- Issue status management (open → in progress → resolved)
- Email notifications when issues are reported
- Issue filtering and search
- Issue assignment to team members
- Comments/discussion on issues
- Issue priority levels

## Testing Checklist
- [ ] Click "Report an Issue" button - full page view opens
- [ ] Back button returns to dashboard
- [ ] Try submitting empty form - validation errors show
- [ ] Fill subject only - validation error for component and description
- [ ] Fill all required fields - form submits successfully
- [ ] Upload screenshot - preview shows correctly
- [ ] Remove screenshot - preview disappears
- [ ] Upload file > 5MB - error message shows
- [ ] Upload non-image file - error message shows
- [ ] Submit with screenshot - screenshot URL stored in database
- [ ] Success screen shows with Issue ID
- [ ] Auto-redirects to dashboard after 3 seconds
- [ ] Check database - issue record created with correct data
- [ ] Check MinIO - screenshot uploaded to issue-screenshots folder
- [ ] Sidebar button shows active state when on Report Issue page

## Usage
**For Admins:**
1. Navigate to any view in Admin Dashboard
2. Click "Report an Issue" in the sidebar
3. Fill in the form with issue details
4. Optionally upload a screenshot
5. Click "Submit Report"
6. Note the Issue ID for reference

**For Developers:**
Query issues from database:
```sql
-- Get all open issues
SELECT * FROM report_issues WHERE status = 'open' ORDER BY created_at DESC;

-- Get issues by component
SELECT * FROM report_issues WHERE component = 'Dashboard';

-- Get issues by reporter
SELECT * FROM report_issues WHERE reported_by = 'Admin Name';
```

## Notes
- Feature is only available in Admin Dashboard (not Therapist Dashboard)
- Full-page view (not a modal/lightbox)
- Screenshots are optional but recommended for visual issues
- Issue IDs are auto-generated and sequential
- All timestamps are in database timezone (Asia/Kolkata)
- Reporter information is auto-filled from logged-in user
- Back button and auto-redirect provide easy navigation
