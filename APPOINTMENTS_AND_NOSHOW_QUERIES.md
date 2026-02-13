# Appointments and No Show Queries - Exact SQL

## 1. All Appointments Section Query

**Endpoint**: `GET /api/appointments`  
**File**: `api/index.ts` (lines 428-490)

### SQL Query:
```sql
SELECT 
  b.booking_id,
  b.booking_invitee_time,
  b.booking_resource_name,
  b.invitee_name,
  b.invitee_phone,
  b.invitee_email,
  b.booking_host_name,
  b.booking_mode,
  b.booking_start_at,
  b.booking_joining_link,
  b.booking_checkin_url,
  b.therapist_id,
  b.booking_status,
  CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes,
  (b.booking_start_at < NOW()) as is_past
FROM bookings b
LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
ORDER BY b.booking_start_at DESC
```

### Key Points:
- ✅ **Fetches ALL bookings** (no filtering by status in SQL)
- ✅ Joins with `client_session_notes` to check if notes exist
- ✅ Calculates `is_past` to determine if session has ended
- ✅ Orders by booking start date (newest first)
- ✅ **Includes no_show bookings** in the result

### Post-Processing (JavaScript):
After fetching, the status is transformed:

```javascript
let status = row.booking_status;

// Only modify status if NOT cancelled or no_show
if (row.booking_status !== 'cancelled' && 
    row.booking_status !== 'canceled' && 
    row.booking_status !== 'no_show' && 
    row.booking_status !== 'no show') {
  
  if (row.has_session_notes) {
    status = 'completed';
  } else if (row.is_past) {
    status = 'pending_notes';
  }
}

// If booking_status IS 'no_show', it stays as 'no_show'
```

**Result**: 
- No_show bookings are included in the response
- Their status remains 'no_show' (not changed to 'completed' or 'pending_notes')
- Frontend filters them into the "No Show" tab

---

## 2. No Show Stats Card Query

**Endpoint**: `GET /api/dashboard/stats`  
**File**: `api/index.ts` (lines 186-193)

### SQL Query (With Date Filter):
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_status IN ('no_show', 'no show') 
  AND booking_start_at BETWEEN $start AND '$end 23:59:59'
```

### SQL Query (Without Date Filter - All Time):
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_status IN ('no_show', 'no show')
```

### Key Points:
- ✅ Counts bookings where `booking_status` is exactly 'no_show' or 'no show'
- ✅ Supports date range filtering (optional)
- ✅ Simple COUNT query - very efficient
- ✅ Handles both variations: 'no_show' and 'no show' (with space)

### Response Format:
```json
{
  "noShows": 5,
  "lastMonthNoShows": 2,
  // ... other stats
}
```

---

## 3. Last Month No Shows Query

**Same Endpoint**: `GET /api/dashboard/stats`  
**File**: `api/index.ts` (lines 216-219)

### SQL Query:
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_status IN ('no_show', 'no show') 
  AND booking_start_at BETWEEN $lastMonthStart AND $lastMonthEnd
```

### Date Calculation:
```javascript
const now = new Date();
const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
```

---

## Important Observations

### ✅ What Works Correctly:

1. **All Appointments Query**:
   - Fetches ALL bookings including no_show
   - Preserves no_show status (doesn't override it)
   - Frontend correctly filters them into "No Show" tab

2. **No Show Stats Query**:
   - Accurately counts bookings with status 'no_show' or 'no show'
   - Supports date filtering
   - Handles both status variations

### ⚠️ Potential Issues:

1. **Status Variations**:
   - Database has both 'no_show' (underscore) and 'no show' (space)
   - Queries handle both, but inconsistent data entry could cause issues
   - **Recommendation**: Standardize to 'no_show' (with underscore)

2. **No Filtering in SQL**:
   - All appointments query fetches everything, then filters in JavaScript
   - For large datasets, this could be inefficient
   - **Recommendation**: Add WHERE clause for specific tabs

3. **Session Notes Join**:
   - Uses `b.booking_id = csn.booking_id` 
   - booking_id in bookings is INTEGER
   - booking_id in client_session_notes is TEXT
   - Currently works but could cause issues
   - **Recommendation**: Ensure consistent data types

---

## Example Queries to Test

### Check all no_show bookings:
```sql
SELECT 
  booking_id,
  invitee_name,
  booking_resource_name,
  booking_status,
  booking_start_at
FROM bookings
WHERE booking_status IN ('no_show', 'no show')
ORDER BY booking_start_at DESC;
```

### Count no_shows by month:
```sql
SELECT 
  TO_CHAR(booking_start_at, 'YYYY-MM') as month,
  COUNT(*) as no_show_count
FROM bookings
WHERE booking_status IN ('no_show', 'no show')
GROUP BY TO_CHAR(booking_start_at, 'YYYY-MM')
ORDER BY month DESC;
```

### Check no_shows with session notes (edge case):
```sql
SELECT 
  b.booking_id,
  b.invitee_name,
  b.booking_status,
  csn.note_id
FROM bookings b
LEFT JOIN client_session_notes csn ON b.booking_id::text = csn.booking_id
WHERE b.booking_status IN ('no_show', 'no show')
  AND csn.note_id IS NOT NULL;
```

---

## Summary

### All Appointments:
- **Query**: Fetches ALL bookings with LEFT JOIN to session notes
- **Filtering**: Done in JavaScript, not SQL
- **No Show Handling**: Status preserved, not overridden

### No Show Stats:
- **Query**: Simple COUNT with status filter
- **Variations**: Handles both 'no_show' and 'no show'
- **Date Range**: Optional filtering by booking_start_at

Both queries work correctly and will show no_show bookings in their respective sections.
