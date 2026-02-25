# Therapist Status Check on Login - FIXED ✅

## Problem
After logging in with email + password, therapists were seeing full dashboard access without any status restrictions:
- No "Profile Under Review" banner
- All pages visible (Bookings, Clients, etc.)
- No indication that profile is pending admin approval

The status check logic was only working for OTP login flow, not for regular email+password login.

## Root Cause
The `/api/login` endpoint was not checking the therapist's approval status. It only returned the user object from the `users` table without checking:
- If therapist exists in `therapists` table (approved)
- If profile is in `therapist_details` table with status='pending_review'

## Solution Implemented

Updated `/api/login` endpoint in `server/index.ts` to check therapist status:

```typescript
if (result.rows.length > 0) {
  const user = result.rows[0];
  
  // For therapists, check their approval status
  if (user.role === 'therapist' && user.therapist_id) {
    try {
      // Check if therapist exists in therapists table (approved)
      const therapistCheck = await pool.query(
        'SELECT therapist_id FROM therapists WHERE therapist_id = $1',
        [user.therapist_id]
      );
      
      // If not in therapists table, check therapist_details for status
      if (therapistCheck.rows.length === 0) {
        const detailsCheck = await pool.query(
          'SELECT status FROM therapist_details WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1',
          [user.email]
        );
        
        if (detailsCheck.rows.length > 0) {
          const status = detailsCheck.rows[0].status;
          // Add profile status to user object
          user.profileStatus = status; // 'pending_review', 'approved', 'rejected'
          user.needsProfileCompletion = false; // Profile already submitted
        }
      } else {
        // Therapist is approved
        user.profileStatus = 'approved';
        user.needsProfileCompletion = false;
      }
    } catch (statusError) {
      console.error('Error checking therapist status:', statusError);
    }
  }
  
  res.json({ success: true, user });
}
```

## How It Works

### For Pending Therapists:
1. User logs in with email + password
2. System checks if `therapist_id` exists in `therapists` table
3. If NOT found → checks `therapist_details` table
4. Gets status from `therapist_details` (e.g., 'pending_review')
5. Adds to user object:
   - `profileStatus: 'pending_review'`
   - `needsProfileCompletion: false`
6. Dashboard shows:
   - ✅ "Profile Under Review" banner
   - ✅ Empty states for Bookings/Clients
   - ✅ Limited functionality

### For Approved Therapists:
1. User logs in with email + password
2. System finds `therapist_id` in `therapists` table
3. Adds to user object:
   - `profileStatus: 'approved'`
   - `needsProfileCompletion: false`
4. Dashboard shows:
   - ✅ Full access to all features
   - ✅ Real data (bookings, clients, etc.)
   - ✅ No banner

## Status Flow

```
New Therapist (OTP Login)
  ↓
needsProfileCompletion: true
  ↓
Complete Profile Form
  ↓
Data saved to therapist_details (status: 'pending_review')
User account created in users table
  ↓
Login with Email + Password
  ↓
profileStatus: 'pending_review' ← NEW CHECK
  ↓
Dashboard shows "Under Review" banner
  ↓
Admin Approves
  ↓
Data moved to therapists table
  ↓
Login with Email + Password
  ↓
profileStatus: 'approved' ← NEW CHECK
  ↓
Full dashboard access
```

## User Object Fields

### Pending Therapist:
```javascript
{
  id: 14,
  username: 'shuklashobhit111@gmail.com',
  email: 'shuklashobhit111@gmail.com',
  name: 'Shobhit Shukla',
  role: 'therapist',
  therapist_id: 'shobhit9884',
  profileStatus: 'pending_review',  // ← Added by login check
  needsProfileCompletion: false     // ← Added by login check
}
```

### Approved Therapist:
```javascript
{
  id: 3,
  username: 'Ishika',
  email: 'ishika@example.com',
  name: 'Ishika Mahajan',
  role: 'therapist',
  therapist_id: '58768',
  profileStatus: 'approved',        // ← Added by login check
  needsProfileCompletion: false     // ← Added by login check
}
```

## Dashboard Behavior

The `TherapistDashboard` component already has logic to check `isProfileUnderReview`:

```typescript
const isProfileUnderReview = user.profileStatus === 'pending_review' || 
                               (user.needsProfileCompletion === false && !user.therapist_id);
```

When `isProfileUnderReview` is true:
- Shows "Profile Under Review" banner
- Shows empty states for Bookings and Clients pages
- Skips API calls (returns empty data)
- Displays 0 for all stats

## Testing

### Test 1: Pending Therapist Login
1. Login with: `shobhit@fluid.live` + password
2. ✅ Should see "Profile Under Review" banner
3. ✅ Dashboard stats should show 0
4. ✅ Bookings page should show empty state
5. ✅ Clients page should show empty state

### Test 2: Approved Therapist Login
1. Login with: `Ishika` + password (approved therapist)
2. ✅ Should NOT see "Under Review" banner
3. ✅ Dashboard stats should show real numbers
4. ✅ Bookings page should show real data
5. ✅ Clients page should show real data

### Test 3: Welcome Message
1. Login with: `shuklashobhit111@gmail.com` + password
2. ✅ Should see "Welcome Back, Shobhit Shukla!" (not email)

## Files Modified

1. **server/index.ts**
   - Updated `/api/login` endpoint
   - Added therapist status check logic
   - Sets `profileStatus` and `needsProfileCompletion` fields

2. **components/TherapistDashboard.tsx**
   - Updated welcome message to show name instead of username
   - Already had `isProfileUnderReview` logic (no changes needed)

## Status
✅ COMPLETE - Therapists now see correct status-based UI after email+password login
