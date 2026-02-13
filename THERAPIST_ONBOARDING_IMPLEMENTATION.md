# Therapist Onboarding Implementation

## Status: Phase 1-3 Complete + TherapistSettings Complete ✅

## What's Been Implemented:

### Phase 1: Database Setup ✅
- Created migration script: `scripts/addTherapistOnboardingColumns.ts`
- **EXECUTED SUCCESSFULLY** ✅
- Added to `new_therapist_requests` table:
  - `otp_token` (VARCHAR)
  - `otp_expires_at` (TIMESTAMP)
  - `status` (VARCHAR - 'pending'/'completed'/'expired')
- Added to `therapists` table:
  - `qualification_pdf_url` (TEXT)
  - `profile_picture_url` (TEXT)
  - `is_profile_complete` (BOOLEAN)
  - `phone_number` (VARCHAR)

### Phase 2: Backend API Endpoints ✅
Created in both `api/index.ts` and `server/index.ts`:

1. **Updated `/api/new-therapist-requests` (POST)**
   - Generates 6-digit OTP
   - Sets 24-hour expiry
   - Stores in database
   - Logs OTP to console (email sending TODO)

2. **Created `/api/verify-therapist-otp` (POST)**
   - Verifies email + OTP
   - Checks expiry
   - Returns pre-filled data for profile completion

3. **Created `/api/complete-therapist-profile` (POST)**
   - Creates therapist entry
   - Creates user entry for login
   - Updates request status to 'completed'

4. **Created `/api/therapist-profile` (GET)**
   - Fetches therapist profile data

5. **Created `/api/therapist-profile` (PUT)**
   - Updates therapist profile

6. **Created `/api/update-password` (POST)** ✅
   - Updates user password
   - Verifies current password first

### Phase 3: Frontend Components ✅

1. **Created `CompleteProfileModal.tsx`** ✅
   - Modal popup for profile completion
   - Pre-filled fields (editable):
     - Name
     - Email (with Gmail note)
     - Phone (country code + number)
     - Specializations (checkboxes with price & description)
   - New fields:
     - Qualification (text input)
     - Qualification PDF upload (placeholder - max 5MB)
     - Profile Picture upload (placeholder - max 2MB, JPG/PNG/WebP)
     - Create Password (with validation)
     - Confirm Password
   - Password validation: min 8 chars, uppercase, lowercase, number
   - File upload placeholders ready for S3 bucket integration

2. **Updated `LoginForm.tsx`** ✅
   - Added toggle between normal login and OTP login
   - "First Time Login?" button switches to OTP mode
   - OTP mode: Email + 6-digit OTP input
   - On successful OTP verification, shows CompleteProfileModal
   - After profile completion, returns to normal login

3. **Updated `NewTherapist.tsx`** ✅
   - Changed success message to: "The link has been sent to the therapist for profile completion, once it completed our tech team will further start the new therapist onboarding."

4. **Created `TherapistSettings.tsx`** ✅
   - Full settings page with two sections:
     - **Profile Information Section:**
       - Name, Email, Phone (editable)
       - Specializations with prices/descriptions
       - Qualification text field
       - Qualification PDF upload (with current file display)
       - Profile Picture upload (with preview)
       - "Save Profile Changes" button
     - **Change Password Section:**
       - Current password verification
       - New password with validation
       - Confirm password
       - "Update Password" button
   - Toast notifications for success/error
   - Loading states
   - File size/type validation

5. **Updated `TherapistDashboard.tsx`** ✅
   - Added "Settings" menu item in sidebar (with Settings icon)
   - Integrated TherapistSettings component
   - Settings view accessible from sidebar
   - Back button returns to dashboard

6. **Updated `TherapistDashboard.tsx` - Active/Inactive Stats** ✅
   - Changed color from #21615D to #000000 (black)

## What's Pending:

### Phase 4: Email Service (TODO - Waiting for Credentials)
- Install nodemailer package
- Create email utility
- Create email template
- Integrate with `/api/new-therapist-requests`
- **Credentials needed:** Gmail SMTP for therapy@safestories.in

### Phase 5: File Upload (TODO - Waiting for S3 Bucket Link)
- Implement actual file upload to S3/storage bucket
- PDF upload for qualifications
- Image upload for profile picture
- Return URLs to store in database

### Phase 6: Profile Completion Check (TODO)
- Check `is_profile_complete` flag on therapist login
- Show CompleteProfileModal if profile incomplete
- Force profile completion before accessing dashboard

## Testing Checklist:

1. ✅ Run database migration
2. ⏳ Test admin adding new therapist (check OTP in console logs)
3. ⏳ Test OTP login flow
4. ⏳ Test profile completion modal
5. ⏳ Test profile creation
6. ⏳ Test login with new credentials
7. ⏳ Test Settings page access
8. ⏳ Test profile editing
9. ⏳ Test password change

## Files Modified:

### Database:
- `scripts/addTherapistOnboardingColumns.ts` (NEW)

### Backend:
- `api/index.ts` (6 new endpoints)
- `server/index.ts` (6 new endpoints)

### Frontend:
- `components/CompleteProfileModal.tsx` (NEW)
- `components/TherapistSettings.tsx` (NEW)
- `components/LoginForm.tsx` (UPDATED)
- `components/NewTherapist.tsx` (UPDATED)
- `components/TherapistDashboard.tsx` (UPDATED - Settings menu + color change)

## Next Steps:

1. Get Gmail SMTP credentials for therapy@safestories.in
2. Implement email service
3. Get S3 bucket link
4. Implement file uploads
5. Add profile completion check on login
6. Test complete flow
7. Push to production

## Notes:

- File uploads are currently placeholders (files selected but not uploaded)
- OTP is logged to console instead of being emailed
- Username for therapist login is email prefix (before @)
- Password is stored as plain text (consider hashing in production)
- Settings page fully functional except for file uploads
