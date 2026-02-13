# No Show Query Fix - Summary

## Issue
Therapist dashboard queries were only checking for `'no_show'` (with underscore), while admin dashboard queries checked for both `'no_show'` and `'no show'` (with space). This inconsistency could cause no-show bookings to appear in admin stats but not in therapist stats if the database contained the space variation.

## Changes Made

### Files Updated:
1. `api/index.ts` - Lines 909-918, 936-939
2. `server/index.ts` - Lines 920-929, 947-950

### Before (Inconsistent):
```typescript
// Therapist Dashboard - ONLY checked underscore version
const noShows = await pool.query(
  'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2',
  [`%${therapistFirstName}%`, 'no_show']
);

const lastMonthNoShows = await pool.query(
  'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status = $2 AND booking_start_at BETWEEN $3 AND $4',
  [`%${therapistFirstName}%`, 'no_show', lastMonthStart, lastMonthEnd]
);
```

### After (Consistent):
```typescript
// Therapist Dashboard - NOW checks BOTH variations
const noShows = await pool.query(
  'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3)',
  [`%${therapistFirstName}%`, 'no_show', 'no show']
);

const lastMonthNoShows = await pool.query(
  'SELECT COUNT(*) as total FROM bookings WHERE booking_host_name ILIKE $1 AND booking_status IN ($2, $3) AND booking_start_at BETWEEN $4 AND $5',
  [`%${therapistFirstName}%`, 'no_show', 'no show', lastMonthStart, lastMonthEnd]
);
```

## Queries Updated

### 1. Current Period No-Shows Count
**Endpoint**: `GET /api/therapist-stats`

**With Date Filter:**
```sql
-- BEFORE
WHERE booking_status = 'no_show'

-- AFTER
WHERE booking_status IN ('no_show', 'no show')
```

**Without Date Filter:**
```sql
-- BEFORE
WHERE booking_status = 'no_show'

-- AFTER
WHERE booking_status IN ('no_show', 'no show')
```

### 2. Last Month No-Shows Count
**Endpoint**: `GET /api/therapist-stats`

```sql
-- BEFORE
WHERE booking_status = 'no_show' 
  AND booking_start_at BETWEEN $start AND $end

-- AFTER
WHERE booking_status IN ('no_show', 'no show') 
  AND booking_start_at BETWEEN $start AND $end
```

## Impact

### Before Fix:
- ❌ If database had `booking_status = 'no show'` (with space):
  - Admin dashboard: Shows in stats ✓
  - Therapist dashboard: Does NOT show in stats ✗
  - Result: Inconsistent counts between admin and therapist views

### After Fix:
- ✅ Both `'no_show'` and `'no show'` variations are counted
- ✅ Admin and therapist dashboards now consistent
- ✅ All no-show bookings appear in stats regardless of format

## Testing

### Test Query 1: Check for both variations in database
```sql
SELECT 
  booking_status,
  COUNT(*) as count
FROM bookings
WHERE booking_status LIKE '%no%show%'
GROUP BY booking_status;
```

Expected results:
- `no_show` - X bookings
- `no show` - Y bookings (if any exist)

### Test Query 2: Verify therapist no-show count
```sql
SELECT COUNT(*) as total
FROM bookings
WHERE booking_host_name ILIKE '%Ishika%'
  AND booking_status IN ('no_show', 'no show');
```

This should now match the count shown in therapist dashboard.

### Test Query 3: Compare admin vs therapist counts
```sql
-- Admin count (all therapists)
SELECT COUNT(*) as admin_total
FROM bookings
WHERE booking_status IN ('no_show', 'no show');

-- Therapist count (specific therapist)
SELECT COUNT(*) as therapist_total
FROM bookings
WHERE booking_host_name ILIKE '%Ishika%'
  AND booking_status IN ('no_show', 'no show');
```

## Related Queries (Already Correct)

These queries were already handling both variations correctly:

### Upcoming Bookings Exclusion:
```sql
WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
```
✅ Already excludes both variations

### All Appointments:
```sql
SELECT * FROM bookings WHERE booking_host_name ILIKE '%Ishika%'
```
✅ No status filter - includes all bookings

## Recommendation for Future

### Standardize Database Values
Consider running a migration to standardize all no-show statuses:

```sql
-- Update all 'no show' (with space) to 'no_show' (with underscore)
UPDATE bookings 
SET booking_status = 'no_show' 
WHERE booking_status = 'no show';
```

**Benefits:**
- Consistent data format
- Simpler queries (only need to check one value)
- Easier to maintain

**After standardization, queries could be simplified to:**
```sql
WHERE booking_status = 'no_show'  -- Only need to check one value
```

But for now, checking both variations ensures backward compatibility.

## Verification Steps

1. ✅ Code changes applied to both `api/index.ts` and `server/index.ts`
2. ✅ No TypeScript/syntax errors
3. ✅ Queries now match admin dashboard behavior
4. ⏳ Restart server to apply changes
5. ⏳ Test therapist dashboard to verify no-show counts

## Next Steps

1. **Restart the server** to apply the changes
2. **Test with Ketki's booking** (ID: 672837) to verify it appears in therapist stats
3. **Compare counts** between admin and therapist dashboards
4. **Consider database standardization** to use only 'no_show' format going forward
