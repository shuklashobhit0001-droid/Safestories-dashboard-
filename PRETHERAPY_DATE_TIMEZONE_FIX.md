# Pre-Therapy Date Timezone Fix

## Issue
Pre-Therapy dates were showing different values on Vercel vs local development for some clients.

## Root Cause
The `formatPreTherapyDate` function was using local timezone methods (`getDate()`, `getFullYear()`) to parse the `latest_booking_date` field, which is a GMT timestamp (`booking_start_at`).

### Why This Caused Differences:
- **Local Development**: Converts GMT to your machine's local timezone (e.g., IST = GMT+5:30)
- **Vercel Server**: Converts GMT to server's timezone (likely UTC = GMT+0)

### Example:
If a booking is at `2026-02-18T23:30:00.000Z` (GMT):
- **Local (IST)**: Converts to Feb 19, 2026 5:00 AM → displays "19 Feb 2026"
- **Vercel (UTC)**: Stays as Feb 18, 2026 11:30 PM → displays "18 Feb 2026"

## Solution
Updated `formatPreTherapyDate` to use UTC methods instead of local timezone methods:

```typescript
const formatPreTherapyDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  // Use UTC methods to avoid timezone differences
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
};
```

### Changes:
- `getDate()` → `getUTCDate()`
- `getFullYear()` → `getUTCFullYear()`
- Added `timeZone: 'UTC'` to `toLocaleString()`

## Result
Now both Vercel and local development will show the same date for Pre-Therapy clients, using the UTC date from the GMT timestamp.

## Files Modified
- `components/AllClients.tsx`

## Status
✅ Fixed - Dates will now be consistent across all environments
