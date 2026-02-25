# Therapist Onboarding - Final Implementation

## ✅ Complete Implementation Summary

### 1. Database Architecture

**New Table: `therapist_details`**
- Stores all profile data submitted by therapists
- Separate from `therapists` table (for active therapists)
- Status: `pending_review` → `approved` → `rejected`

**Data Flow:**
```
Admin fills form → new_therapist_requests (with OTP)
                ↓
Therapist logs in with OTP → temporary user object
                ↓
Therapist fills profile modal → therapist_details (pending_review)
                ↓
Admin reviews → approves → creates entries in therapists + users tables
```

### 2. UI Components Created

#### ProfileUnderReviewBanner.tsx
- Yellow banner shown on dashboard
- Informs therapist about 5-10 day review period
- Shows what they can do during review

#### EmptyStateCard.tsx
- Reusable empty state component
- Used for Bookings and Clients pages
- Shows icon, title, message, and sub-message

#### CompleteProfileModal.tsx (Updated)
- Profile picture at TOP (circular preview like admin dashboard)
- Auto-fills data from admin's input
- Shows success modal after submission (no more alert)
- Success modal has:
  - ✅ checkmark icon
  - Success message
  - Review timeline (5-10 days)
  - "Go to Dashboard" button

### 3. Empty States Implementation

**When Profile is Under Review:**

**Dashboard Page:**
- Shows ProfileUnderReviewBanner at top
- Stats cards show actual data (0 if no data)
- Upcoming bookings section works normally

**My Bookings Page:**
- Shows empty state card
- Icon: 📅
- Message: "Your booking calendar will be available once your profile is approved"

**My Clients Page:**
- Shows empty state card
- Icon: 👥
- Message: "You'll start seeing your clients here once your profile is approved"

**Profile Page:**
- FULL ACCESS (can view/edit profile)

**Notifications Page:**
- Works normally

### 4. User Object Structure

```typescript
// After OTP login (before profile completion)
{
  id: requestId,
  therapist_id: requestId,
  username: email prefix,
  email: email,
  role: 'therapist',
  full_name: name,
  needsProfileCompletion: true,
  profileStatus: 'pending_review',
  profileData: { ...prefill data }
}

// After profile submission
{
  ...same as above,
  needsProfileCompletion: false,  // Modal won't show again
  profileStatus: 'pending_review'  // Still under review
}

// After admin approval (future)
{
  ...normal therapist user object,
  profileStatus: 'approved',
  therapist_id: actual_therapist_id
}
```

### 5. Complete User Journey

#### Step 1: Admin Creates Request
1. Admin goes to "Add New Therapist"
2. Fills: name, email, phone, specializations, prices
3. Submits → stores in `new_therapist_requests`
4. OTP email sent to therapist

#### Step 2: Therapist First Login
1. Therapist receives email with OTP
2. Goes to login page → "First Time Login"
3. Enters email + OTP
4. System verifies OTP
5. Creates temporary user object
6. Redirects to dashboard

#### Step 3: Profile Completion
1. Dashboard loads
2. CompleteProfileModal opens automatically
3. Form pre-filled with admin's data
4. Therapist sees:
   - Profile picture upload (at top, circular)
   - Name (pre-filled)
   - Email (pre-filled)
   - Phone (pre-filled with +91 default)
   - Specializations (pre-selected with prices)
   - Qualification text field
   - Qualification PDF upload
   - Create password
   - Confirm password
5. Therapist fills remaining fields
6. Clicks "Save Changes"

#### Step 4: Success Modal
1. Success modal appears
2. Shows:
   - ✅ checkmark
   - "Profile Submitted Successfully!"
   - Review timeline: 5-10 days
   - Email notification promise
3. Therapist clicks "Go to Dashboard"
4. Page reloads

#### Step 5: Dashboard with Empty States
1. Dashboard loads with ProfileUnderReviewBanner
2. Stats show 0 (no bookings yet)
3. Therapist can:
   - ✅ View dashboard layout
   - ✅ See empty states on Bookings/Clients
   - ✅ View/edit profile
   - ✅ Change password
   - ✅ View notifications
   - ❌ Cannot receive bookings (not approved yet)

#### Step 6: Admin Approval (Future Feature)
1. Admin sees pending profiles
2. Reviews therapist_details
3. Approves profile
4. System creates:
   - Entry in `therapists` table
   - Entry in `users` table
5. Sends approval email
6. Therapist logs in again
7. Full dashboard access

### 6. API Endpoints

#### POST `/api/complete-therapist-profile`
**Request:**
```json
{
  "requestId": 21,
  "name": "Shobhit",
  "email": "shobhit@fluid.live",
  "phone": "+916362474363",
  "specializations": "Individual Therapy",
  "specializationDetails": [
    { "name": "Individual Therapy", "price": "1500", "description": "..." }
  ],
  "qualification": "M.A. Clinical Psychology",
  "qualificationPdfUrl": null,
  "profilePictureUrl": null,
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile submitted successfully! Your profile will be reviewed by admin within 5-10 days.",
  "detailsId": 1
}
```

**Database Actions:**
1. Inserts into `therapist_details` with status='pending_review'
2. Updates `new_therapist_requests` status='profile_submitted'

### 7. Files Modified

**New Files:**
- `components/ProfileUnderReviewBanner.tsx`
- `components/EmptyStateCard.tsx`
- `scripts/createTherapistDetailsTable.ts`
- `scripts/checkTherapistDetailsTable.ts`
- `THERAPIST_DETAILS_TABLE_IMPLEMENTATION.md`

**Modified Files:**
- `components/CompleteProfileModal.tsx` - Profile picture at top, success modal
- `components/TherapistDashboard.tsx` - Empty states, banner, profile status check
- `components/LoginForm.tsx` - Added profileStatus to user object
- `server/index.ts` - Updated endpoint to use therapist_details table

### 8. Testing Checklist

- [x] Table created successfully
- [x] Profile picture shows at top (circular)
- [x] Form auto-fills from admin data
- [x] Phone number defaults to +91
- [x] Success modal appears after submission
- [ ] Data stored in therapist_details table
- [ ] Banner shows on dashboard
- [ ] Empty states show on Bookings page
- [ ] Empty states show on Clients page
- [ ] Profile page accessible
- [ ] Page reloads after "Go to Dashboard"

### 9. Next Steps (Future)

1. **Admin Review UI**
   - Create "Pending Profiles" section in admin dashboard
   - Show list of therapist_details with status='pending_review'
   - Add approve/reject buttons

2. **Approval Flow**
   - When approved: create therapist + user entries
   - Send approval email
   - Update therapist_details status='approved'

3. **File Upload Integration**
   - Integrate S3/MinIO for profile pictures
   - Integrate S3/MinIO for qualification PDFs
   - Update URLs in database

4. **Password Hashing**
   - Add bcrypt for secure password storage
   - Hash password before storing

5. **Rejection Flow**
   - Allow admin to reject with reason
   - Send rejection email
   - Allow therapist to resubmit

### 10. Current Status

✅ **COMPLETE AND READY TO TEST**

All components are implemented:
- Database table created
- API endpoint updated
- UI components created
- Empty states implemented
- Success modal working
- Profile picture at top
- Auto-fill working
- Phone number defaults to +91

**To test:**
1. Admin adds new therapist request
2. Therapist logs in with OTP
3. Fills profile form
4. Sees success modal
5. Dashboard shows banner and empty states

## Summary

The therapist onboarding flow is now complete with a clean separation between submission data (`therapist_details`) and active therapist data (`therapists`). The UI provides clear feedback about the review process, and empty states prevent confusion during the 5-10 day review period.
