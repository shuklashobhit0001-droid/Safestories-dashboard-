# Sanjana Session Status Mapping - Complete Analysis

## Session Details (From UI)
- **Date/Time**: Friday, Feb 6, 2026 at 2:30 PM - 3:20 PM IST
- **Session**: Individual Therapy Session with Ishika Mahajan
- **Client**: Sanjana (+91 9764328147)
- **Status Shown**: **Completed** (Green badge)

## Database Reality

### Actual Database Values:
```
booking_id: 678420
invitee_name: Sanjana
invitee_email: sjoshi1597@gmail.com
booking_resource_name: Individual Therapy Session with Ishika Mahajan
booking_host_name: Ishika
booking_status: "no show" (with space!)
booking_start_at: 2026-02-06T09:00:00.000Z (UTC)
booking_invitee_time: Friday, Feb 6, 2026 at 10:00 AM - 10:50 AM (GMT+01:00)
has_session_notes: true
session_note_id: 10
```

### Key Finding:
- ✅ Database has: `booking_status = "no show"` (with space)
- ✅ Session notes exist: `note_id = 10`
- ⚠️ **Time mismatch**: DB shows 10:00 AM, UI shows 2:30 PM

## Status Mapping Flow

### Step 1: Backend Query (api/index.ts)
```sql
SELECT 
  b.booking_status,
  CASE WHEN csn.note_id IS NOT NULL THEN true ELSE false END as has_session_notes
FROM bookings b
LEFT JOIN client_session_notes csn ON b.booking_id = csn.booking_id
WHERE b.booking_id = 678420
```

**Result:**
- `booking_status = "no show"`
- `has_session_notes = true`

### Step 2: Backend Status Transformation
```typescript
let status = row.booking_status; // "no show"

if (row.booking_status !== 'cancelled' && 
    row.booking_status !== 'canceled' && 
    row.booking_status !== 'no_show' &&    // ← Checking underscore version
    row.booking_status !== 'no show') {     // ← Checking space version
  
  // This condition is FALSE because booking_status IS 'no show'
  // So status is NOT changed
}

// Status remains: "no show"
```

**Backend sends to frontend:** `booking_status = "no show"`

### Step 3: Frontend Status Determination (TherapistDashboard.tsx)
```typescript
const getAppointmentStatus = (apt: any) => {
  if (apt.booking_status === 'cancelled') return 'cancelled';
  if (apt.booking_status === 'no_show') return 'no_show';  // ← Checks underscore
  // apt.booking_status is "no show" (with space), so this check FAILS!
  
  if (apt.has_session_notes) return 'completed';  // ← THIS MATCHES!
  // ...
}
```

## 🚨 THE BUG!

### Root Cause:
**Frontend only checks for `'no_show'` (underscore), not `'no show'` (space)**

```typescript
// Current code (INCOMPLETE):
if (apt.booking_status === 'no_show') return 'no_show';

// Should be (COMPLETE):
if (apt.booking_status === 'no_show' || apt.booking_status === 'no show') return 'no_show';
```

### What Happens:
1. Database has: `booking_status = "no show"` (with space)
2. Backend preserves it: `"no show"`
3. Frontend checks: `apt.booking_status === 'no_show'` → **FALSE** (doesn't match!)
4. Frontend continues to next check: `apt.has_session_notes` → **TRUE**
5. Frontend returns: `'completed'`
6. UI shows: **"Completed"** with green badge ❌ WRONG!

### What Should Happen:
1. Database has: `booking_status = "no show"`
2. Backend preserves it: `"no show"`
3. Frontend checks: `apt.booking_status === 'no_show' || apt.booking_status === 'no show'` → **TRUE**
4. Frontend returns: `'no_show'`
5. UI shows: **"No Show"** with orange badge ✅ CORRECT!

## The Fix Needed

### File: `components/TherapistDashboard.tsx`
**Line**: ~1222

**Current Code:**
```typescript
const getAppointmentStatus = (apt: any) => {
  if (apt.booking_status === 'cancelled') return 'cancelled';
  if (apt.booking_status === 'no_show') return 'no_show';  // ← INCOMPLETE
  if (apt.has_session_notes) return 'completed';
  // ...
}
```

**Fixed Code:**
```typescript
const getAppointmentStatus = (apt: any) => {
  if (apt.booking_status === 'cancelled') return 'cancelled';
  if (apt.booking_status === 'no_show' || apt.booking_status === 'no show') return 'no_show';  // ← FIXED
  if (apt.has_session_notes) return 'completed';
  // ...
}
```

### File: `components/Appointments.tsx`
**Line**: ~193

**Current Code:**
```typescript
const getAppointmentStatus = (apt: Appointment) => {
  if (apt.booking_status === 'cancelled' || apt.booking_status === 'canceled') return 'cancelled';
  if (apt.booking_status === 'no_show' || apt.booking_status === 'no show') return 'no_show';  // ← ALREADY CORRECT!
  if (apt.has_session_notes) return 'completed';
  // ...
}
```

**Status**: ✅ Already handles both variations correctly!

### File: `components/AllTherapists.tsx`
**Line**: ~405

**Current Code:**
```typescript
if (status !== 'cancelled' && status !== 'no_show') {  // ← INCOMPLETE
  if (apt.has_session_notes) {
    status = 'completed';
  }
}
```

**Fixed Code:**
```typescript
if (status !== 'cancelled' && status !== 'no_show' && status !== 'no show') {  // ← FIXED
  if (apt.has_session_notes) {
    status = 'completed';
  }
}
```

## Summary

### Current Behavior:
- ❌ Sanjana's session shows as **"Completed"** (green)
- ❌ Appears in **"Completed"** tab
- ❌ Incorrect because database status is "no show"

### Correct Behavior (After Fix):
- ✅ Sanjana's session should show as **"No Show"** (orange)
- ✅ Should appear in **"No Show"** tab
- ✅ Matches database status

### Why This Happened:
1. Database has `booking_status = "no show"` (with space)
2. Session notes were added (note_id = 10)
3. Frontend doesn't check for space variation
4. Falls through to "has_session_notes" check
5. Shows as "Completed" instead of "No Show"

### Priority:
**HIGH** - This is a critical bug that causes incorrect status display when:
- Booking has status "no show" (with space)
- AND session notes exist
- Result: Shows as "Completed" instead of "No Show"

## Files to Update:
1. ✅ `api/index.ts` - Backend already handles both (lines 455)
2. ✅ `server/index.ts` - Backend already handles both
3. ❌ `components/TherapistDashboard.tsx` - **NEEDS FIX** (line ~1222)
4. ✅ `components/Appointments.tsx` - Already correct (line 193)
5. ❌ `components/AllTherapists.tsx` - **NEEDS FIX** (line ~405)
