# Therapist Dashboard Queries - Complete Analysis

## Overview
The Therapist Dashboard uses therapist-specific queries that filter by `booking_host_name` (therapist's first name).

---

## 1. Therapist Stats (Dashboard Cards)

**Endpoint**: `GET /api/therapist-stats?therapist_id={id}&start={date}&end={date}`  
**File**: `api/index.ts` (lines 861-980)

### A. Sessions Count

**With Date Filter:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status IN ('confirmed', 'rescheduled') 
  AND booking_start_at BETWEEN $start AND '$end 23:59:59'
```

**Without Date Filter (All Time):**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status IN ('confirmed', 'rescheduled')
```

**Key Points:**
- ✅ Filters by therapist's first name (e.g., 'Ishika')
- ✅ Only counts 'confirmed' and 'rescheduled' bookings
- ❌ Does NOT count 'no_show', 'cancelled', or 'completed' bookings

---

### B. No-Shows Count

**With Date Filter:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status = 'no_show' 
  AND booking_start_at BETWEEN $start AND '$end 23:59:59'
```

**Without Date Filter (All Time):**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status = 'no_show'
```

**Key Points:**
- ✅ Filters by therapist's first name
- ✅ Only counts bookings with status = 'no_show'
- ⚠️ **Only checks 'no_show'** (not 'no show' with space)
- ⚠️ **Potential Issue**: If database has 'no show' (with space), it won't be counted

---

### C. Cancelled Count

**With Date Filter:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status IN ('cancelled', 'canceled') 
  AND booking_start_at BETWEEN $start AND '$end 23:59:59'
```

**Without Date Filter (All Time):**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status IN ('cancelled', 'canceled')
```

---

### D. Last Month Stats

**Last Month Sessions:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status IN ('confirmed', 'rescheduled') 
  AND booking_start_at BETWEEN $lastMonthStart AND $lastMonthEnd
```

**Last Month No-Shows:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status = 'no_show' 
  AND booking_start_at BETWEEN $lastMonthStart AND $lastMonthEnd
```

**Last Month Cancelled:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%' 
  AND booking_status IN ('cancelled', 'canceled') 
  AND booking_start_at BETWEEN $lastMonthStart AND $lastMonthEnd
```

---

## 2. Upcoming Bookings (Dashboard)

**Endpoint**: `GET /api/therapist-stats` (same endpoint)  
**File**: `api/index.ts` (lines 950-960)

### SQL Query:
```sql
SELECT 
  booking_id,
  invitee_name as client_name,
  booking_resource_name as session_name,
  booking_mode as mode,
  booking_invitee_time as session_timings,
  booking_start_at as booking_date
FROM bookings
WHERE booking_host_name ILIKE '%{therapistFirstName}%'
  AND booking_start_at + INTERVAL '50 minutes' >= NOW()
  AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
ORDER BY booking_start_at ASC
LIMIT 10
```

**Key Points:**
- ✅ Filters by therapist's first name
- ✅ Only shows future bookings (session hasn't ended yet)
- ✅ **Excludes no_show bookings** from upcoming list
- ✅ Handles both 'no_show' and 'no show' variations
- ✅ Limits to 10 upcoming bookings

---

## 3. All Appointments (Appointments View)

**Endpoint**: `GET /api/therapist-appointments?therapist_id={id}`  
**File**: `api/index.ts` (lines 990-1050)

### SQL Query:
```sql
SELECT 
  b.booking_id,
  b.invitee_name as client_name,
  b.invitee_phone as contact_info,
  b.booking_resource_name as session_name,
  b.booking_invitee_time as session_timings,
  b.booking_mode as mode,
  b.booking_start_at as booking_date,
  b.booking_status,
  CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
FROM bookings b
LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
WHERE b.booking_host_name ILIKE '%{therapistFirstName}%'
ORDER BY b.booking_start_at DESC
```

**Key Points:**
- ✅ Fetches **ALL appointments** for the therapist (no status filtering)
- ✅ **Includes no_show bookings** in results
- ✅ Joins with session notes to check if notes exist
- ✅ Orders by booking date (newest first)
- ✅ No LIMIT - returns all appointments

**Post-Processing:**
- Frontend applies `getAppointmentStatus()` function
- No_show status is preserved (not changed)
- Frontend filters into tabs (Upcoming, Completed, No Show, etc.)

---

## 4. Client Appointments (Client Detail View)

**Endpoint**: `GET /api/client-appointments?client_phone={phone}&therapist_id={id}`  
**File**: `api/index.ts` (lines 1100+)

### SQL Query:
```sql
SELECT 
  b.booking_id,
  b.invitee_name,
  b.booking_resource_name as therapy_type,
  b.booking_invitee_time as session_timings,
  b.booking_mode as mode,
  b.booking_start_at as booking_date,
  b.booking_status,
  CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
FROM bookings b
LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
WHERE b.invitee_phone = $client_phone
  AND b.booking_host_name ILIKE '%{therapistFirstName}%'
ORDER BY b.booking_start_at DESC
```

**Key Points:**
- ✅ Filters by client phone AND therapist name
- ✅ **Includes no_show bookings** for that client
- ✅ Used in client detail view to show appointment history

---

## Important Differences: Admin vs Therapist

### Admin Dashboard:
- Queries ALL bookings (no therapist filter)
- Uses: `SELECT ... FROM bookings`

### Therapist Dashboard:
- Queries only THEIR bookings
- Uses: `WHERE booking_host_name ILIKE '%{therapistFirstName}%'`

---

## Critical Issues Found

### ⚠️ Issue 1: No Show Status Variation
**Problem:**
- Admin queries check: `booking_status IN ('no_show', 'no show')`
- Therapist queries check: `booking_status = 'no_show'` (only underscore version)

**Impact:**
- If database has 'no show' (with space), therapist won't see it in stats
- Admin will see it correctly

**Example:**
```sql
-- Admin query (CORRECT)
WHERE booking_status IN ('no_show', 'no show')  -- Handles both

-- Therapist query (INCOMPLETE)
WHERE booking_status = 'no_show'  -- Only handles underscore version
```

**Fix Needed:**
```sql
-- Change therapist no-show queries to:
WHERE booking_status IN ('no_show', 'no show')
```

### ⚠️ Issue 2: Therapist Name Matching
**Problem:**
- Uses `ILIKE '%{therapistFirstName}%'` (partial match)
- Could match wrong therapist if names overlap

**Example:**
- Therapist: "Ishika Mahajan"
- Query: `WHERE booking_host_name ILIKE '%Ishika%'`
- Could also match: "Ishika Sharma", "Aishika", etc.

**Better Approach:**
```sql
-- Use exact match or full name
WHERE booking_host_name = 'Ishika Mahajan'
-- OR use therapist_id if available
WHERE therapist_id = $therapist_id
```

---

## Summary Table

| Query Purpose | Includes No-Show? | Status Filter | Date Filter |
|--------------|-------------------|---------------|-------------|
| **Stats - Sessions** | ❌ No | confirmed, rescheduled | Optional |
| **Stats - No-Shows** | ✅ Yes (only) | no_show | Optional |
| **Stats - Cancelled** | ❌ No | cancelled, canceled | Optional |
| **Upcoming Bookings** | ❌ Excluded | NOT (cancelled, no_show) | Future only |
| **All Appointments** | ✅ Yes | None (all statuses) | None |
| **Client Appointments** | ✅ Yes | None (all statuses) | None |

---

## Test Queries

### Check therapist's no-show bookings:
```sql
SELECT 
  booking_id,
  invitee_name,
  booking_status,
  booking_start_at
FROM bookings
WHERE booking_host_name ILIKE '%Ishika%'
  AND booking_status IN ('no_show', 'no show')
ORDER BY booking_start_at DESC;
```

### Verify status variations:
```sql
SELECT 
  booking_status,
  COUNT(*) as count
FROM bookings
WHERE booking_host_name ILIKE '%Ishika%'
  AND (booking_status LIKE '%no%show%' OR booking_status LIKE '%no_show%')
GROUP BY booking_status;
```

### Check if therapist name matching is accurate:
```sql
SELECT DISTINCT booking_host_name
FROM bookings
WHERE booking_host_name ILIKE '%Ishika%';
```
