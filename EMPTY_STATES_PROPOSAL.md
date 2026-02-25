# Empty States for Profile Under Review

## Overview

When a therapist completes their profile, it goes under review for 5-10 days. During this period, the therapist should have limited access to the dashboard with empty states showing on most pages.

## Proposed Empty States

### 1. Dashboard Page
**Status**: Show limited stats

**Display**:
```
┌─────────────────────────────────────────┐
│  📋 Profile Under Review                │
│                                         │
│  Your profile is currently being        │
│  reviewed by our team. This usually     │
│  takes 5-10 days.                       │
│                                         │
│  You'll receive an email once your      │
│  profile is approved!                   │
│                                         │
│  In the meantime, you can:              │
│  • View your profile                    │
│  • Update your password                 │
│  • Explore the dashboard                │
└─────────────────────────────────────────┘

Stats Cards: All showing "0" with note "Available after approval"
Upcoming Bookings: Empty state
```

### 2. My Bookings Page
**Status**: Empty state

**Display**:
```
┌─────────────────────────────────────────┐
│         📅                              │
│                                         │
│  No Bookings Yet                        │
│                                         │
│  Your booking calendar will be          │
│  available once your profile is         │
│  approved by our team.                  │
│                                         │
│  Expected approval: 5-10 days           │
└─────────────────────────────────────────┘
```

### 3. My Clients Page
**Status**: Empty state

**Display**:
```
┌─────────────────────────────────────────┐
│         👥                              │
│                                         │
│  No Clients Yet                         │
│                                         │
│  You'll start seeing your clients       │
│  here once your profile is approved     │
│  and you receive your first booking.    │
│                                         │
│  Expected approval: 5-10 days           │
└─────────────────────────────────────────┘
```

### 4. Notifications Page
**Status**: Show system notification

**Display**:
```
┌─────────────────────────────────────────┐
│  🔔 System Notification                 │
│  2 hours ago                            │
│                                         │
│  Welcome to SafeStories!                │
│                                         │
│  Your profile has been submitted and    │
│  is currently under review. We'll       │
│  notify you via email once it's         │
│  approved.                              │
└─────────────────────────────────────────┘
```

### 5. Profile Page
**Status**: FULL ACCESS (Read-only or editable)

**Display**:
- Show all profile information
- Allow viewing all details
- Optional: Allow editing certain fields
- Show "Under Review" badge at top

## Implementation Plan

### Step 1: Add Profile Status to User Object
```typescript
interface User {
  id: number;
  username: string;
  role: string;
  needsProfileCompletion: boolean;
  profileStatus: 'pending' | 'approved' | 'rejected'; // NEW
}
```

### Step 2: Update Database
Add `profile_status` column to `therapists` table:
```sql
ALTER TABLE therapists 
ADD COLUMN profile_status VARCHAR(20) DEFAULT 'pending';

-- Update existing therapists
UPDATE therapists 
SET profile_status = 'approved' 
WHERE is_profile_complete = true;
```

### Step 3: Create Empty State Components

#### EmptyStateCard.tsx
```typescript
interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  subMessage?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  message,
  subMessage
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-center max-w-md mb-2">{message}</p>
      {subMessage && (
        <p className="text-sm text-gray-500 text-center">{subMessage}</p>
      )}
    </div>
  );
};
```

#### ProfileUnderReviewBanner.tsx
```typescript
export const ProfileUnderReviewBanner: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">📋</div>
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800 mb-1">
            Profile Under Review
          </h4>
          <p className="text-sm text-yellow-700">
            Your profile is currently being reviewed by our team. 
            This usually takes 5-10 days. You'll receive an email 
            once your profile is approved!
          </p>
        </div>
      </div>
    </div>
  );
};
```

### Step 4: Update TherapistDashboard.tsx

Add profile status check:
```typescript
const isProfileUnderReview = user.profileStatus === 'pending';

// In dashboard view
{activeView === 'dashboard' && (
  <>
    {isProfileUnderReview && <ProfileUnderReviewBanner />}
    {/* Rest of dashboard content */}
  </>
)}

// In bookings view
{activeView === 'appointments' && (
  <>
    {isProfileUnderReview ? (
      <EmptyStateCard
        icon="📅"
        title="No Bookings Yet"
        message="Your booking calendar will be available once your profile is approved by our team."
        subMessage="Expected approval: 5-10 days"
      />
    ) : (
      // Normal bookings view
    )}
  </>
)}

// Similar for clients view
{activeView === 'clients' && (
  <>
    {isProfileUnderReview ? (
      <EmptyStateCard
        icon="👥"
        title="No Clients Yet"
        message="You'll start seeing your clients here once your profile is approved and you receive your first booking."
        subMessage="Expected approval: 5-10 days"
      />
    ) : (
      // Normal clients view
    )}
  </>
)}
```

### Step 5: Update Login Flow

Modify `LoginForm.tsx` to include profile status:
```typescript
const tempUser = {
  id: data.data.requestId,
  username: email.split('@')[0],
  email: email,
  role: 'therapist',
  full_name: data.data.name,
  needsProfileCompletion: true,
  profileStatus: 'pending', // NEW
  profileData: data.data
};
```

After profile completion, update status:
```typescript
// In CompleteProfileModal after successful submission
const updatedUser = {
  ...user,
  needsProfileCompletion: false,
  profileStatus: 'pending' // Still pending until admin approves
};
```

### Step 6: Admin Approval Interface (Future)

Add admin interface to approve/reject profiles:
```typescript
// In AdminDashboard
<button onClick={() => approveTherapistProfile(therapistId)}>
  Approve Profile
</button>

// API endpoint
app.post('/api/admin/approve-therapist', async (req, res) => {
  const { therapistId } = req.body;
  
  await pool.query(
    `UPDATE therapists 
     SET profile_status = 'approved' 
     WHERE therapist_id = $1`,
    [therapistId]
  );
  
  // Send approval email to therapist
  await sendApprovalEmail(therapistEmail);
  
  res.json({ success: true });
});
```

## User Experience Flow

### New Therapist Journey:
1. ✅ Receives OTP email
2. ✅ Logs in with OTP
3. ✅ Completes profile in modal
4. ✅ Sees success message
5. ✅ Dashboard loads with "Under Review" banner
6. ✅ All pages show empty states
7. ✅ Can only access Profile page fully
8. ⏳ Waits 5-10 days
9. 📧 Receives approval email
10. ✅ Logs in again
11. ✅ Full dashboard access
12. ✅ Can receive bookings

### What Therapist Can Do During Review:
- ✅ View their profile
- ✅ Change password
- ✅ See dashboard layout
- ✅ Read notifications
- ❌ Cannot see bookings (empty state)
- ❌ Cannot see clients (empty state)
- ❌ Cannot receive bookings yet

### What Therapist Can Do After Approval:
- ✅ Full dashboard access
- ✅ See all bookings
- ✅ Manage clients
- ✅ Receive notifications
- ✅ Accept new bookings
- ✅ Complete session notes

## Implementation Priority

### Phase 1 (Current Session):
- ✅ Profile completion modal
- ✅ Success modal
- ✅ Basic flow working

### Phase 2 (Next Session):
- Add `profile_status` column
- Create empty state components
- Update dashboard to show empty states
- Add "Under Review" banner

### Phase 3 (Future):
- Admin approval interface
- Approval email notification
- Profile rejection flow
- Resubmission process

## Questions to Ask User

1. **Profile Access**: Should therapists be able to edit their profile during review, or should it be read-only?

2. **Notifications**: Should we send a notification when profile is submitted? When approved?

3. **Stats Cards**: Should stats show "0" or should they be hidden completely during review?

4. **Navigation**: Should we disable navigation to Bookings/Clients pages, or show empty states?

5. **Timeline**: Is 5-10 days the actual review timeline, or should we make it configurable?

6. **Rejection**: What happens if a profile is rejected? Can therapist resubmit?

## Recommendation

I recommend implementing Phase 2 in the next session. It's a clean UX that:
- Clearly communicates the review status
- Doesn't confuse therapists with empty data
- Allows them to explore the interface
- Sets proper expectations
- Maintains professional appearance

Would you like me to proceed with implementing the empty states?
