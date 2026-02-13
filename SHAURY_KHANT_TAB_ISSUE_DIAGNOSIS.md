# Shaury Khant - Tab Display Issue Diagnosis

## Problem
Client "Shaury Khant" has 4 paid therapy sessions but is showing "Pre-therapy Notes" tab instead of the full 4 tabs (Overview, Case History, Progress Notes, Goal Tracking).

## Root Cause
The client has **NO CASE HISTORY** in the `client_case_history` table, even though they have 4 paid therapy sessions.

## Data Analysis

### Client Info
- Name: Shaury Khant
- Phone: +91 9272109799
- Email: shaury.khant@gmail.com

### Bookings (4 total)
1. Individual Therapy Session - Feb 14, 2026 (Upcoming)
2. Individual Therapy Session - Jan 31, 2026 (Completed - Pending Notes)
3. Individual Therapy Session - Jan 21, 2026 (Completed - Pending Notes)
4. Individual Therapy Session - Jan 15, 2026 (Completed - Pending Notes)

### Database Check Results
- ✅ Bookings: 4 records found
- ❌ Case History: 0 records (MISSING!)
- ❌ Free Consultation Notes: 0 records
- ❌ Free Consultation Bookings: 0 records

### API Logic Result
```javascript
hasPaidSessions: false  // Because no case history
hasFreeConsultation: false  // No free consultation data
```

## Why This Happens

The logic in `/api/client-session-type` (server/index.ts line 2899) checks:

```typescript
// Check if client has any paid sessions (case history exists)
const caseHistoryResult = await pool.query(
  'SELECT id FROM client_case_history WHERE client_id = $1 LIMIT 1',
  [client_id]
);
const hasPaidSessions = caseHistoryResult.rows.length > 0;
```

**Problem**: This assumes case history is filled via Paperform BEFORE or DURING the first session. But if:
1. Therapist hasn't filled the Paperform yet
2. N8N automation hasn't run
3. Case history form is pending

Then `hasPaidSessions = false` even though the client has actual paid bookings!

## Current Tab Logic (TherapistDashboard.tsx)

```typescript
if (!clientSessionType.hasPaidSessions && clientSessionType.hasFreeConsultation) {
  // Show only 2 tabs: Overview + Pre-therapy Notes
} else if (clientSessionType.hasPaidSessions) {
  // Show all 4 tabs: Overview + Case History + Progress Notes + Goal Tracking
} else {
  // Default: Show all 4 tabs
}
```

**Issue**: When both are `false`, it falls to default (shows all 4 tabs), but the UI shows "Pre-therapy Notes" message.

## The Real Issue

Looking at the UI output:
```
Pre-therapy Notes: Pre-therapy notes will appear after consultation form is filled
Overview
Pre-therapy Notes  <-- This tab is showing!
```

This means the component IS showing the "Pre-therapy Notes" tab, which only happens when:
```typescript
!hasPaidSessions && hasFreeConsultation
```

But our check shows BOTH are false! This suggests there's a **frontend state issue** or the API is returning different data than expected.

## Solution Options

### Option 1: Fix the Logic (Recommended)
Change the logic to check for ACTUAL paid bookings instead of relying on case history:

```typescript
// Check if client has any paid sessions (non-free-consultation bookings)
const paidBookingsResult = await pool.query(
  `SELECT booking_id FROM bookings 
   WHERE invitee_phone = $1 
   AND booking_resource_name NOT ILIKE '%free consultation%'
   LIMIT 1`,
  [client_id]
);
const hasPaidSessions = paidBookingsResult.rows.length > 0;
```

### Option 2: Default Behavior
When both are false, default to showing all 4 tabs (assume paid sessions).

### Option 3: Hybrid Approach
Check BOTH case history AND bookings:
```typescript
const hasPaidSessions = caseHistoryResult.rows.length > 0 || paidBookingsResult.rows.length > 0;
```

## Recommendation

**Use Option 3 (Hybrid Approach)** because:
1. Case history is the ideal indicator (means Paperform was filled)
2. Bookings are the fallback (means client has paid sessions even if form not filled yet)
3. Handles both scenarios correctly

## Files to Modify
- `server/index.ts` - Line 2899-2940 (client-session-type endpoint)

## Reference Files
- Implementation: `FREE_CONSULTATION_IMPLEMENTATION.md`
- Original logic: `THERAPY_DOCS_COMPLETE_IMPLEMENTATION.md`
- Component: `components/TherapistDashboard.tsx` (line ~2100-2150)
- Component: `components/AllTherapists.tsx` (similar logic)
