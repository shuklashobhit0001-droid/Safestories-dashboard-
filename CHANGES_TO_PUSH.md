# Changes Ready to Push

## Last Commit
`177cc7e - feat: Enable Add New Therapist button on Vercel`

## Modified Files (7)

### 1. **components/AllClients.tsx**
- Added "Last Session Booked" column to Clients tab
- Added `last_session_date` and `booking_resource_name` fields to Client interface
- Added `formatDate()` function to parse and format booking_invitee_time dates
- Updated colspan values from 6 to 7 for table rows

### 2. **components/AllTherapists.tsx**
- Changed therapist view layout from side-by-side to stacked (full width)
- Added search bar to Assigned Clients table
- Combined Email and Phone into single "Contact Info" column
- Added "Session Name" column showing therapy type
- Updated pagination to work with filtered search results

### 3. **components/TherapistDashboard.tsx**
- Fixed "Last Session" stats card to use IST time fields instead of GMT
- Changed date parsing from `booking_start_at_raw` to `booking_invitee_time`
- Ensures correct timezone display for last session date

### 4. **components/TherapistCalendar.tsx**
- Added "Join Now" button for online sessions in therapist calendar modals
- Button appears next to "Online" mode indicator
- Opens booking_joining_link in new tab

### 5. **components/Dashboard.tsx**
- Simplified booking tabs in client view from 6 tabs to 2:
  - "Upcoming" (replaces Upcoming + Scheduled)
  - "Booking History" (replaces All, shows all bookings with status)
- Added "Last Session" stats card showing most recent completed/pending_notes session
- Reorganized stats card layout

### 6. **api/index.ts**
- Updated `/api/clients` endpoint to include `last_session_date` field
- Added logic to calculate last session date for past sessions (excluding cancelled/no_show)
- Updated `/api/therapist-appointments` to include `booking_joining_link` field
- Uses `booking_invitee_time` for accurate date tracking

### 7. **server/index.ts**
- Applied identical changes to keep local development in sync with Vercel
- Updated `/api/clients` endpoint with last_session_date logic
- Updated `/api/therapist-appointments` to include booking_joining_link

## New Documentation Files (3)
- `LAST_SESSION_BOOKED_IMPLEMENTATION.md` - Details of Last Session Booked column
- `CLIENT_VIEW_UPDATES.md` - Client view tabs and stats changes
- `JOIN_NOW_BUTTON_IMPLEMENTATION.md` - Join Now button implementation

## Test/Debug Files (Not to be committed)
Multiple test scripts created for debugging (check_*.ts, test_*.ts, debug_*.ts)

---

## Summary of Features

### ✅ Last Session Booked Column
- Shows most recent past session date (excluding cancelled/no_show)
- Format: "DD MMM YYYY" (e.g., "27 Jan 2026")
- Displays "N/A" if no qualifying sessions

### ✅ Therapist View Improvements
- Stacked layout (full width sections)
- Searchable Assigned Clients table
- Combined contact info display
- Session name column added

### ✅ Client View Simplification
- 2 tabs instead of 6 (Upcoming + Booking History)
- New "Last Session" stats card
- Cleaner, more intuitive interface

### ✅ Join Now Button
- Added to Therapist Calendar for online sessions
- Matches Admin Dashboard functionality
- Quick access to session links

### ✅ Timezone Fixes
- Last Session card now uses IST time correctly
- Consistent date display across all views

---

## Repository Status
- Branch: `main`
- Status: Up to date with `origin/main`
- Modified files: 7
- Ready to commit: Yes

## Recommended Commit Message
```
feat: Add Last Session Booked column and improve therapist/client views

- Add "Last Session Booked" column to All Clients - Clients tab
- Improve therapist view with search, stacked layout, and session names
- Simplify client view tabs (Upcoming + Booking History)
- Add "Last Session" stats card to client view
- Add "Join Now" button to therapist calendar for online sessions
- Fix timezone issues in Last Session display (use IST instead of GMT)
- Update both api/index.ts and server/index.ts for consistency
```
