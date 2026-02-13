# Dashboard Stats Update - Bookings & Sessions Completed

## Changes Made

### 1. Added New "Bookings" Stat Card
- **What it counts**: ALL bookings regardless of status
- **Includes**: cancelled, canceled, no_show, no show, confirmed, rescheduled, completed, pending_notes, scheduled, AND free consultations
- **Query**: `SELECT COUNT(*) FROM bookings`

### 2. Renamed "Sessions" to "Sessions Completed"
- **What it counts**: ALL completed sessions (paid + free consultations) where session date has passed - includes both sessions with notes AND pending notes
- **Excludes**: Cancelled, no_show, and future/upcoming sessions
- **Query**: 
```sql
SELECT COUNT(*) FROM bookings b
WHERE b.booking_start_at < NOW()
AND b.booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
```

**Note**: This includes free consultations that have been completed or have pending notes. The "Free Consultations" stat card shows ALL free consultations (past, present, and future).

## Stats Card Order (8 cards total)
1. Revenue
2. Refunded
3. **Bookings** (NEW)
4. **Sessions Completed** (RENAMED from "Sessions")
5. Free Consultations
6. Cancelled
7. Refunds
8. No Show

## Files Modified
1. `api/index.ts` - Updated `/api/dashboard/stats` endpoint
2. `server/index.ts` - Updated `/api/dashboard/stats` endpoint
3. `components/Dashboard.tsx` - Updated stats display

## API Response Changes
**Before:**
```json
{
  "sessions": 78,
  "lastMonthSessions": 0
}
```

**After:**
```json
{
  "bookings": 89,
  "lastMonthBookings": 0,
  "sessionsCompleted": 65,
  "lastMonthSessionsCompleted": 0
}
```

## Testing
- Verify "Bookings" shows total count of all bookings
- Verify "Sessions Completed" only shows paid sessions with notes submitted
- Verify date filters work correctly for both stats
