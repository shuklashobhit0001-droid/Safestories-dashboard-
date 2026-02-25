# 📊 Sessions Completed Logic Explanation

## Overview

"Sessions Completed" is a stat card in the Therapist Dashboard that shows the count of completed therapy sessions.

---

## 🔍 Current Logic

### Definition
**Sessions Completed** = All bookings where:
1. ✅ Session start time is in the PAST (`booking_start_at < NOW()`)
2. ✅ Status is NOT cancelled or no-show
3. ✅ Includes both paid and free consultations

### SQL Query (Therapist-Specific)

```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%'
  AND booking_start_at < NOW()
  AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
```

### With Date Filter
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_host_name ILIKE '%{therapistFirstName}%'
  AND booking_start_at < NOW()
  AND booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
  AND booking_start_at BETWEEN '{start}' AND '{end} 23:59:59'
```

---

## 📋 What Gets Counted

### ✅ INCLUDED in Sessions Completed:
1. **Confirmed sessions** (status = 'confirmed') that have ended
2. **Rescheduled sessions** (status = 'rescheduled') that have ended
3. **Any other status** that is NOT cancelled or no-show and has ended
4. **Free consultations** that have ended
5. **Paid sessions** that have ended

### ❌ EXCLUDED from Sessions Completed:
1. **Cancelled sessions** (status = 'cancelled' or 'canceled')
2. **No-show sessions** (status = 'no_show' or 'no show')
3. **Future sessions** (booking_start_at >= NOW())
4. **Ongoing sessions** (booking_start_at >= NOW())

---

## 🎯 Logic Breakdown

### Step 1: Time Check
```javascript
booking_start_at < NOW()
```
- Only counts sessions that have already started
- Excludes upcoming/future sessions

### Step 2: Status Check
```javascript
booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
```
- Excludes cancelled sessions
- Excludes no-show sessions
- Includes all other statuses (confirmed, rescheduled, etc.)

### Step 3: Therapist Filter
```javascript
booking_host_name ILIKE '%{therapistFirstName}%'
```
- Only counts sessions for the logged-in therapist
- Uses case-insensitive partial match

---

## 📊 Example Scenarios

### Scenario 1: Session on Feb 20, 2026 (Past)
- **Status**: confirmed
- **Result**: ✅ COUNTED (past + not cancelled/no-show)

### Scenario 2: Session on Feb 20, 2026 (Past)
- **Status**: cancelled
- **Result**: ❌ NOT COUNTED (excluded status)

### Scenario 3: Session on Feb 20, 2026 (Past)
- **Status**: no_show
- **Result**: ❌ NOT COUNTED (excluded status)

### Scenario 4: Session on Feb 28, 2026 (Future)
- **Status**: confirmed
- **Result**: ❌ NOT COUNTED (future session)

### Scenario 5: Session on Feb 20, 2026 (Past)
- **Status**: rescheduled
- **Result**: ✅ COUNTED (past + not cancelled/no-show)

### Scenario 6: Free Consultation on Feb 20, 2026 (Past)
- **Status**: confirmed
- **Payment**: 0 or NULL
- **Result**: ✅ COUNTED (past + not cancelled/no-show)

---

## 🔄 Related Stats

### 1. Bookings (Total)
- **Logic**: COUNT all bookings (regardless of status or time)
- **Includes**: Past, present, future, cancelled, no-show, everything

### 2. Sessions Completed
- **Logic**: COUNT bookings where time < NOW() AND status NOT IN (cancelled, no-show)
- **Includes**: Only past sessions that were not cancelled or no-show

### 3. No-shows
- **Logic**: COUNT bookings where status IN ('no_show', 'no show')
- **Includes**: Only no-show sessions

### 4. Cancelled
- **Logic**: COUNT bookings where status IN ('cancelled', 'canceled')
- **Includes**: Only cancelled sessions

---

## 📈 Relationship Between Stats

```
Total Bookings = Sessions Completed + No-shows + Cancelled + Upcoming
```

### Example:
- Total Bookings: 100
- Sessions Completed: 60 (past sessions that happened)
- No-shows: 10 (past sessions where client didn't show up)
- Cancelled: 15 (sessions that were cancelled)
- Upcoming: 15 (future sessions)

**Verification**: 60 + 10 + 15 + 15 = 100 ✅

---

## 🎨 Frontend Display

### Location
- **Component**: TherapistDashboard.tsx
- **Section**: Stats Cards (top of dashboard)
- **Position**: 2nd card (after "Bookings")

### Display Format
```tsx
<div className="bg-white border rounded-lg p-4">
  <p className="text-sm text-gray-600 mb-1">Sessions Completed</p>
  <p className="text-3xl font-bold text-gray-900">{value}</p>
</div>
```

### Clickable Behavior
- **Clickable**: Yes
- **Action**: Switches to "My Bookings" view
- **Tab**: Opens "Completed" tab
- **Shows**: All completed sessions in the bookings table

---

## 🔧 Code Locations

### Backend (API)
1. **Admin Dashboard Stats**: `api/index.ts` lines 1015-1028
2. **Therapist Dashboard Stats**: `api/index.ts` lines 1933-1950

### Frontend
1. **Stats Display**: `components/TherapistDashboard.tsx` line 56
2. **Stats Update**: `components/TherapistDashboard.tsx` lines 621, 659
3. **Client Stats**: `components/TherapistDashboard.tsx` lines 544-552

---

## ⚠️ Important Notes

### 1. Time-Based Calculation
- Uses `NOW()` function (current server time)
- Sessions are counted as "completed" immediately after their start time passes
- Does NOT check if session notes are filled

### 2. Status Flexibility
- Any status except cancelled/no-show is counted
- This means even "pending_notes" sessions are counted as completed
- Rationale: Session happened, just notes not filled yet

### 3. No Session Notes Check
- Does NOT verify if session notes exist
- A session is "completed" based on time and status only
- Session notes are tracked separately in "Pending Session Notes" tab

### 4. Free Consultations Included
- Free consultations (payment = 0 or NULL) are counted
- No distinction between paid and free in this stat
- Separate "Free Consultations" stat exists for tracking free sessions

---

## 🎯 Summary

**Sessions Completed** counts all therapy sessions that:
- Have already happened (past)
- Were not cancelled by therapist or client
- Were not marked as no-show

It's a measure of actual therapy work completed, regardless of payment status or whether session notes have been filled.

---

**Last Updated**: February 23, 2026, 7:30 PM IST
**Status**: ✅ Current implementation documented
