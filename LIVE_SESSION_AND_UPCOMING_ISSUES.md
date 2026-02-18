# Live Session Count & Upcoming Sessions - FIXED ✅

## Current Date/Time
Wednesday, Feb 18, 2026 at approximately 5:17 PM IST

## Issue 1: Live Session Count ✅ FIXED
**Problem:** Live session count logic was using database timestamp comparison which had timezone issues.

**Solution:** Updated `/api/live-sessions-count` endpoint to parse `booking_invitee_time` field and compare with current UTC time. The logic now:
1. Parses the human-readable time string (e.g., "Wednesday, Feb 18, 2026 at 12:00 PM - 12:50 PM (GMT+01:00)")
2. Extracts start time, end time, and timezone
3. Converts to UTC and compares with current UTC time
4. Counts sessions where current time is between start and end

**Status:** ✅ Working correctly - shows 1 live session (Sanjana's session ending at 11:50 AM UTC)

## Issue 2: Therapist Status ✅ FIXED
**Problem:** Therapist status was using the same flawed logic as live session count.

**Solution:** Updated `/api/therapists-live-status` endpoint to use the same `booking_invitee_time` parsing logic.

**Status:** ✅ Working correctly - therapist status reflects actual live sessions

## Issue 3: Upcoming Sessions Showing Past Sessions ✅ FIXED
**Problem:** Sessions that already ended were showing in "Upcoming Sessions" because the query used `booking_start_at + INTERVAL '50 minutes'` which:
- Assumed all sessions are 50 minutes (incorrect)
- Had timezone comparison issues with database timestamps

**Solution:** Updated both admin and therapist dashboard endpoints to:
1. Fetch all non-cancelled bookings
2. Parse `booking_invitee_time` to extract end time and timezone
3. Filter client-side to only include sessions where end time > current UTC time
4. Limit results after filtering

**Endpoints Fixed:**
- `/api/dashboard/bookings` (Admin Dashboard)
- `/api/therapist-stats` (Therapist Dashboard)

**Status:** ✅ Working correctly - past sessions (Rohan Chavan, Shraddha Pandey, Meera, Aarohi) are now filtered out

## Test Results (5:17 PM IST / 11:47 AM UTC)
```
✅ Live sessions count: 1 (Sanjana - ends at 11:50 AM UTC)
✅ Admin upcoming sessions: 3 (Sanjana, Shreya Tiwari, Aarchi Joshi)
✅ Therapist upcoming sessions: 3 (Sanjana, Simone Pinto, Harshita Saxena)
✅ Past sessions filtered: YES
```

## Technical Details

### booking_invitee_time Format
```
Wednesday, Feb 18, 2026 at 12:00 PM - 12:50 PM (GMT+01:00)
```

### Parsing Logic
```typescript
const timeMatch = row.booking_invitee_time.match(/at\s+(\d+:\d+\s+[AP]M)\s+-\s+(\d+:\d+\s+[AP]M)/);
const dateStr = row.booking_invitee_time.match(/(\w+,\s+\w+\s+\d+,\s+\d+)/)?.[1];
const timezoneMatch = row.booking_invitee_time.match(/\(([^)]+)\)/);
const timezone = timezoneMatch ? timezoneMatch[1] : 'GMT+0530';
const endIST = new Date(`${dateStr} ${endTimeStr} ${timezone}`);
return endIST > nowUTC; // Filter for upcoming
```

## Files Modified
- `server/index.ts` (lines 888-930, 695-734, 1204-1244, 1529-1690)

## Why This Approach Works
1. **Timezone-aware:** Parses timezone from the booking string itself
2. **Accurate duration:** Uses actual end time, not assumed 50-minute duration
3. **Reliable comparison:** Converts everything to UTC before comparing
4. **Handles all timezones:** Works with GMT+01:00, GMT+05:30, GMT+11:00, etc.
