# 🐛 Client Stats No-Show Bug Fix

## Issue Description

**Client**: Mitesh Rathod
**Problem**: Client detail view showed incorrect stats:
- Bookings: 1 ✅ (correct)
- Sessions Completed: 1 ❌ (WRONG - should be 0)
- No Show: 0 ❌ (WRONG - should be 1)

**Actual Data**: The only booking for Mitesh Rathod has status "No Show", so:
- Sessions Completed should be 0
- No Show should be 1

---

## Root Cause

### Database Status Value
The booking status in the database is stored as:
```
"no show"  (with a space)
```

### Frontend Code Issue
The frontend was checking for:
```javascript
a.booking_status !== 'no_show'  // with underscore
a.booking_status === 'no_show'  // with underscore
```

**Result**: The "no show" status was NOT being recognized, so:
- It was counted as "Sessions Completed" (because it didn't match 'no_show')
- It was NOT counted as "No Show" (because it didn't match 'no_show')

---

## The Fix

### Updated Code (Line 544-553)

**Before**:
```javascript
const sessionsCompleted = filteredAppointments.filter((a: any) => {
  const sessionDate = a.booking_date ? new Date(a.booking_date) : new Date();
  const isPast = sessionDate < new Date();
  const isNotCancelledOrNoShow = a.booking_status !== 'cancelled' && a.booking_status !== 'no_show';
  return isPast && isNotCancelledOrNoShow;
}).length;
const noShows = filteredAppointments.filter((a: any) => a.booking_status === 'no_show').length;
const cancelled = filteredAppointments.filter((a: any) => a.booking_status === 'cancelled').length;
```

**After**:
```javascript
const sessionsCompleted = filteredAppointments.filter((a: any) => {
  const sessionDate = a.booking_date ? new Date(a.booking_date) : new Date();
  const isPast = sessionDate < new Date();
  const isNotCancelledOrNoShow = a.booking_status !== 'cancelled' && 
                                 a.booking_status !== 'canceled' && 
                                 a.booking_status !== 'no_show' && 
                                 a.booking_status !== 'no show';  // Added space version
  return isPast && isNotCancelledOrNoShow;
}).length;
const noShows = filteredAppointments.filter((a: any) => 
  a.booking_status === 'no_show' || a.booking_status === 'no show'  // Check both versions
).length;
const cancelled = filteredAppointments.filter((a: any) => 
  a.booking_status === 'cancelled' || a.booking_status === 'canceled'  // Check both versions
).length;
```

---

## Changes Made

### 1. Sessions Completed Filter
Now excludes BOTH:
- `'no_show'` (underscore version)
- `'no show'` (space version)
- `'cancelled'` (UK spelling)
- `'canceled'` (US spelling)

### 2. No Shows Counter
Now counts BOTH:
- `'no_show'` (underscore version)
- `'no show'` (space version)

### 3. Cancelled Counter
Now counts BOTH:
- `'cancelled'` (UK spelling)
- `'canceled'` (US spelling)

---

## Expected Result After Fix

For Mitesh Rathod:
- **Bookings**: 1 ✅
- **Sessions Completed**: 0 ✅ (no show is excluded)
- **No Show**: 1 ✅ (correctly counted)
- **Cancelled**: 0 ✅

---

## Database Status Values

Based on investigation, the database uses:
- `"no show"` (with space) - NOT `"no_show"` (with underscore)
- `"cancelled"` or `"canceled"` (both spellings exist)

The fix now handles all variations to ensure accurate counting.

---

## Testing

### Test Case 1: Mitesh Rathod
- **Booking**: Feb 12, 2026 at 3:00 PM
- **Status**: "no show"
- **Expected Stats**:
  - Bookings: 1
  - Sessions Completed: 0
  - No Show: 1
  - Cancelled: 0

### Test Case 2: Client with Completed Session
- **Booking**: Past date
- **Status**: "confirmed" or "rescheduled"
- **Expected Stats**:
  - Sessions Completed: 1
  - No Show: 0

### Test Case 3: Client with Cancelled Session
- **Booking**: Any date
- **Status**: "cancelled" or "canceled"
- **Expected Stats**:
  - Sessions Completed: 0
  - Cancelled: 1

---

## Impact

### Files Changed
- `components/TherapistDashboard.tsx` (lines 544-553)

### Affected Views
- Therapist Dashboard → My Clients → Click on client name → Client detail view
- Stats cards showing: Bookings, Sessions Completed, No Show, Cancelled

### Scope
- Only affects client detail stats calculation
- Does NOT affect main dashboard stats (those come from backend API)
- Does NOT affect bookings table display

---

## Related Issues

This same issue might exist in other places where status is checked. Consider reviewing:
1. Admin dashboard client stats
2. Any other frontend status filtering logic

---

## Prevention

To prevent similar issues in the future:
1. **Standardize status values** in database (choose one format)
2. **Use constants** for status values instead of hardcoded strings
3. **Add database constraints** to ensure consistent status values
4. **Create helper functions** for status checking

Example:
```javascript
const isNoShow = (status: string) => 
  status === 'no_show' || status === 'no show';

const isCancelled = (status: string) => 
  status === 'cancelled' || status === 'canceled';
```

---

**Last Updated**: February 23, 2026, 7:45 PM IST
**Status**: ✅ Fixed
**Component**: TherapistDashboard.tsx
**Bug Type**: Status string mismatch (underscore vs space)
