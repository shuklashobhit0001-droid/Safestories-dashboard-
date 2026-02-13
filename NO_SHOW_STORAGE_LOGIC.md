# How Sessions Get Marked as "No Show" - Complete Analysis

## Overview
The "no_show" status is stored in the `booking_status` column of the `bookings` table. This document explains how bookings get this status.

## Database Schema
- **Table**: `bookings`
- **Column**: `booking_status` (TEXT)
- **Possible Values**: 'confirmed', 'cancelled', 'canceled', 'no_show', 'no show', 'rescheduled', 'completed', etc.

## How No Show Status is Set

### 1. **Manual Database Update (Most Common)**
Currently, there is **NO automated API endpoint** or UI button to mark a booking as "no_show". 

The status must be set manually via direct database query:

```sql
UPDATE bookings 
SET booking_status = 'no_show' 
WHERE booking_id = 'BOOKING_ID';
```

### 2. **Database Trigger Notification**
When a booking is updated to 'no_show', a database trigger fires:

**Trigger**: `notify_admins_on_booking()`
**Location**: `scripts/fixNotificationTriggerUserIdCast.ts` (lines 108-120)

```sql
IF OLD.booking_status != 'no_show' AND NEW.booking_status = 'no_show' THEN
  -- Creates notification for all admins
  INSERT INTO notifications (user_id, user_role, notification_type, title, message, ...)
  VALUES (
    admin_id,
    'admin',
    'no_show',
    'Client No-Show',
    'CLIENT_NAME did not show up for session "SESSION_NAME"',
    ...
  );
END IF;
```

**What happens:**
- ✅ All admin users receive a notification
- ✅ Notification type: 'no_show'
- ✅ Title: "Client No-Show"
- ✅ Message includes client name and session name
- ❌ Therapist does NOT receive notification (only admins)

### 3. **External Data Import**
Bookings may be imported from external systems (like Calendly) with the status already set to 'no_show'. The import process would preserve this status.

## Current Limitations

### ❌ No UI Button
There is currently **NO button or interface** in the application to mark a booking as "no_show". 

**Missing functionality:**
- No "Mark as No Show" button in appointments list
- No dropdown to change booking status
- No admin panel to update status

### ❌ No API Endpoint
There is **NO API endpoint** to update booking status to 'no_show'.

**What's missing:**
```typescript
// This endpoint DOES NOT EXIST
app.put('/api/bookings/:id/status', async (req, res) => {
  const { booking_id } = req.params;
  const { status } = req.body;
  // Update booking_status...
});
```

### ❌ No Automated Detection
There is **NO automated system** that:
- Checks if a client didn't join the meeting
- Marks bookings as no_show after session time passes
- Detects no-show based on meeting attendance

## How It Currently Works in Practice

### Scenario: Client doesn't show up for session

1. **Session time passes** → Nothing happens automatically
2. **Therapist notices** → Reports to admin
3. **Admin manually updates database**:
   ```sql
   UPDATE bookings 
   SET booking_status = 'no_show' 
   WHERE booking_id = '672837';
   ```
4. **Trigger fires** → Admin receives notification
5. **Frontend displays** → Booking appears in "No Show" tab with orange badge

## What Should Happen (Recommended Implementation)

### Option 1: Manual UI Button
Add a button in the appointments list:

```typescript
// In appointment actions dropdown
<button onClick={() => markAsNoShow(booking_id)}>
  Mark as No Show
</button>

// API endpoint
app.put('/api/bookings/:id/mark-no-show', async (req, res) => {
  const { id } = req.params;
  await pool.query(
    'UPDATE bookings SET booking_status = $1 WHERE booking_id = $2',
    ['no_show', id]
  );
  // Trigger will automatically create notifications
  res.json({ success: true });
});
```

### Option 2: Automated Detection
Implement a scheduled job that:

```typescript
// Run every 15 minutes
async function detectNoShows() {
  // Find bookings where:
  // - Session ended > 15 minutes ago
  // - Status is still 'confirmed'
  // - No session notes added
  // - Client didn't join meeting (if tracking available)
  
  const noShows = await pool.query(`
    SELECT booking_id 
    FROM bookings 
    WHERE booking_status = 'confirmed'
      AND booking_start_at + INTERVAL '65 minutes' < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM client_session_notes 
        WHERE booking_id = bookings.booking_id::text
      )
  `);
  
  // Mark as no_show
  for (const booking of noShows.rows) {
    await pool.query(
      'UPDATE bookings SET booking_status = $1 WHERE booking_id = $2',
      ['no_show', booking.booking_id]
    );
  }
}
```

### Option 3: Status Dropdown
Add a status dropdown in appointment details:

```typescript
<select 
  value={booking.booking_status} 
  onChange={(e) => updateBookingStatus(booking.booking_id, e.target.value)}
>
  <option value="confirmed">Confirmed</option>
  <option value="completed">Completed</option>
  <option value="cancelled">Cancelled</option>
  <option value="no_show">No Show</option>
  <option value="rescheduled">Rescheduled</option>
</select>
```

## Related Files

### Database Triggers:
- `scripts/fixNotificationTriggerUserIdCast.ts` - Notification trigger for no_show
- `scripts/setupNotificationTriggers.ts` - Trigger setup
- `scripts/setupProductionTriggers.ts` - Production trigger setup

### Frontend Display:
- `components/TherapistDashboard.tsx` - Shows no_show in orange badge
- `components/Appointments.tsx` - Filters no_show appointments
- `components/AllTherapists.tsx` - Admin view of no_show

### Backend Logic:
- `api/index.ts` - Excludes no_show from various queries
- `api/lib/dashboardApiBookingSync.ts` - Booking sync (doesn't handle no_show)

## Summary

**Current State:**
- ✅ No_show status is stored in database
- ✅ Trigger creates notifications when status changes
- ✅ Frontend correctly displays no_show bookings
- ✅ No_show bookings appear in "No Show" tab
- ❌ **NO UI to mark bookings as no_show**
- ❌ **NO API endpoint to update status**
- ❌ **NO automated detection**

**How it's done now:**
- Manual database UPDATE query by admin/developer

**Recommendation:**
- Implement Option 1 (Manual UI Button) for immediate use
- Consider Option 2 (Automated Detection) for long-term improvement
