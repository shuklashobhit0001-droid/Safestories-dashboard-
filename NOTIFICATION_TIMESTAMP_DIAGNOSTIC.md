# Notification Timestamp Diagnostic Report

## 🔍 Investigation Results

### ✅ What's Working:

1. **Database Timestamps:** Correctly stored in UTC format
   - Example: `2026-01-20T05:32:26.596Z`
   - Type: `timestamp without time zone`
   - Default: Auto-generated with IST timezone

2. **API Response:** Correctly returns `created_at` field
   - Endpoint: `/api/notifications`
   - Returns all fields including `created_at`

3. **JavaScript Date Parsing:** Works correctly
   - Timestamps parse correctly
   - Time difference calculation is accurate
   - Should display "1h ago" for 1-hour-old notifications

4. **Frontend formatTime Function:** Logic is correct
   - Correctly calculates time differences
   - Properly formats relative time strings

### ❌ Issues Found:

1. **API Endpoint Mismatch:**
   - Frontend calls: `PUT /api/notifications/read` with body `{notification_id}`
   - Server expects: `PUT /api/notifications/:id/read` with URL param
   - **Impact:** Mark as read functionality is broken

2. **Timestamp Display Issue:**
   - **Expected:** Notifications should show "1h ago", "63m ago", etc.
   - **Actual:** All showing "Just now"
   - **Root Cause:** Unknown - needs browser debugging

## 🔎 Possible Causes for "Just now" Display:

### Theory 1: Frontend State Issue
- Component might not be re-rendering with updated timestamps
- Initial state might have incorrect timestamps

### Theory 2: API Call Timing
- Timestamps might be getting overwritten during state updates
- Race condition in fetchNotifications

### Theory 3: Browser Caching
- Old API responses might be cached
- Service worker or browser cache issue

### Theory 4: created_at Not in Response
- Despite server sending it, frontend might not be receiving it
- Network layer might be stripping the field

## 🛠️ Recommended Fixes:

### Fix 1: API Endpoint Mismatch (CRITICAL)
**File:** `components/Notifications.tsx`

Change:
```typescript
const response = await fetch(`/api/notifications/read`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ notification_id: notificationId })
});
```

To:
```typescript
const response = await fetch(`/api/notifications/${notificationId}/read`, {
  method: 'PUT'
});
```

### Fix 2: Add Debug Logging
Add console.log to see what timestamps are actually received:

```typescript
const fetchNotifications = async () => {
  try {
    setLoading(true);
    const response = await fetch(`/api/notifications?user_id=${userId}&user_role=${userRole}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Received notifications:', data); // DEBUG
      console.log('First notification created_at:', data[0]?.created_at); // DEBUG
      setNotifications(data);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  } finally {
    setLoading(false);
  }
};
```

### Fix 3: Force Re-render
Ensure formatTime is called with current time:

```typescript
const formatTime = (timestamp: string) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const now = new Date(); // Always get fresh current time
  // ... rest of logic
};
```

## 📝 Next Steps:

1. **Fix API endpoint mismatch** (mark as read)
2. **Add debug logging** to see actual timestamps received
3. **Test in browser** to see console output
4. **Check browser network tab** to verify API response
5. **Clear browser cache** and test again

## 🎯 Expected Outcome:

After fixes:
- ✅ Notifications show correct relative time ("1h ago", "5m ago")
- ✅ Mark as read functionality works
- ✅ Timestamps update correctly on page refresh
