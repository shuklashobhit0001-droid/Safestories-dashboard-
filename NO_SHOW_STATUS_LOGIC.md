# No Show Status Logic - Complete Analysis

## Overview
The "no_show" status is handled consistently across the system with specific rules that prevent it from being overridden.

## Database Storage
- **Field**: `booking_status` in `bookings` table
- **Possible values**: `'no_show'` or `'no show'` (both variations are supported)
- **Once set**: The status remains as "no_show" and is NOT changed by other logic

## Frontend Status Determination Logic

### Priority Order (from highest to lowest):

1. **CANCELLED** - Highest priority
   ```typescript
   if (apt.booking_status === 'cancelled' || apt.booking_status === 'canceled') 
     return 'cancelled';
   ```

2. **NO_SHOW** - Second highest priority
   ```typescript
   if (apt.booking_status === 'no_show' || apt.booking_status === 'no show') 
     return 'no_show';
   ```

3. **COMPLETED** - Third priority (only if not cancelled/no_show)
   ```typescript
   if (apt.has_session_notes) 
     return 'completed';
   ```

4. **PENDING_NOTES** - Fourth priority (only if not cancelled/no_show and session ended)
   ```typescript
   if (session_ended && !has_session_notes) 
     return 'pending_notes';
   ```

5. **SCHEDULED** - Default for upcoming sessions

## Key Rules

### ✅ NO_SHOW Status is PROTECTED
- Once `booking_status = 'no_show'` in database, it stays as "no_show"
- **Session notes DO NOT override no_show status**
- **Past session time DOES NOT override no_show status**
- The status check happens BEFORE checking for session notes

### Backend API Logic (api/index.ts)
```typescript
// Line 455-460
if (row.booking_status !== 'cancelled' && 
    row.booking_status !== 'canceled' && 
    row.booking_status !== 'no_show' && 
    row.booking_status !== 'no show') {
  // Only then check for session notes or pending notes
  if (row.has_session_notes) {
    status = 'completed';
  } else if (row.is_past) {
    status = 'pending_notes';
  }
}
```

This means:
- If booking_status is 'no_show', the condition fails
- The status remains 'no_show' and is NOT changed to 'completed' or 'pending_notes'

### Frontend Logic (TherapistDashboard.tsx, Appointments.tsx, AllTherapists.tsx)
```typescript
// Lines 1221-1223 (TherapistDashboard)
const getAppointmentStatus = (apt: any) => {
  if (apt.booking_status === 'cancelled') return 'cancelled';
  if (apt.booking_status === 'no_show') return 'no_show';  // Checked BEFORE session notes
  if (apt.has_session_notes) return 'completed';
  // ... rest of logic
}
```

## Visual Indicators

### Status Badge Colors:
- **No Show**: Orange background (`bg-orange-100 text-orange-700`)
- **Completed**: Green background (`bg-green-100 text-green-700`)
- **Cancelled**: Red background (`bg-red-100 text-red-700`)
- **Pending Notes**: Yellow background (`bg-yellow-100 text-yellow-700`)
- **Scheduled**: Blue background (`bg-blue-100 text-blue-700`)

## Example Scenarios

### Scenario 1: Session marked as no_show, then therapist adds notes
- **Database**: `booking_status = 'no_show'`, `has_session_notes = true`
- **Display**: "No Show" (orange badge)
- **Reason**: no_show check happens before session notes check

### Scenario 2: Session marked as no_show, session time passed
- **Database**: `booking_status = 'no_show'`, `is_past = true`
- **Display**: "No Show" (orange badge)
- **Reason**: no_show check happens before pending_notes logic

### Scenario 3: Regular session with notes
- **Database**: `booking_status = 'confirmed'`, `has_session_notes = true`
- **Display**: "Completed" (green badge)
- **Reason**: Not cancelled/no_show, so session notes logic applies

### Scenario 4: Regular past session without notes
- **Database**: `booking_status = 'confirmed'`, `has_session_notes = false`, `is_past = true`
- **Display**: "Pending Notes" (yellow badge)
- **Reason**: Not cancelled/no_show, past session, no notes

## Statistics Exclusions

No-show sessions are excluded from:
- Live sessions count
- Active sessions count
- Revenue calculations (in some queries)
- Upcoming bookings lists

But included in:
- Total sessions count
- No-show specific statistics
- Historical data

## Database Queries

### Excluding no_show:
```sql
WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
```

### Counting no_show:
```sql
COUNT(CASE WHEN booking_status = 'no_show' THEN 1 END) as no_shows
```

## Conclusion

**The no_show status is PERMANENT and PROTECTED:**
1. It's checked first in the status determination logic
2. It's explicitly excluded from status override conditions
3. Even if session notes are added, the status remains "no_show"
4. This is intentional design to maintain accurate attendance records
