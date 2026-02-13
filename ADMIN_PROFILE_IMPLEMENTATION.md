# Admin Profile Implementation

## Summary
Implemented profile functionality for Admin Dashboard similar to Therapist Dashboard, including profile picture display, edit profile, and change/forgot password features.

## Changes Made

### 1. Database Migration
**File**: `scripts/addAdminProfileColumns.ts`
- Added columns to `users` table:
  - `full_name` VARCHAR(255)
  - `email` VARCHAR(255)
  - `phone` VARCHAR(50)
  - `profile_picture_url` TEXT
- Migrated existing `name` data to `full_name` column

### 2. Backend API Endpoints
**File**: `server/index.ts`

#### GET `/api/admin-profile`
- Fetches admin profile data by user_id
- Returns: id, username, full_name, email, phone, profile_picture_url

#### PUT `/api/admin-profile`
- Updates admin profile information
- Accepts: user_id, name, email, phone, profilePictureUrl
- Returns updated profile data

### 3. Frontend Components

#### AdminEditProfile Component
**File**: `components/AdminEditProfile.tsx`
- Simplified version of EditProfile (no specializations, no qualification)
- Fields: Name, Email, Phone, Profile Picture
- Features:
  - Profile picture upload with compression (max 5MB)
  - Country code selector for phone
  - Auto-refresh after save to show updated profile picture
  - Toast notifications for success/error

#### Dashboard Component Updates
**File**: `components/Dashboard.tsx`
- Added state variables:
  - `showProfileMenu` - controls profile dropdown visibility
  - `profilePictureUrl` - stores admin profile picture URL
- Added ref: `profileMenuRef` - for click-outside detection
- Profile picture fetch in `fetchDashboardData()`
- Profile menu dropdown in sidebar with:
  - Edit Profile option
  - Change/Forgot Password option
- Profile picture display at top of sidebar
- Click-outside handler for profile menu
- View routing for 'settings' and 'changePassword'
- Integrated `AdminEditProfile` and `ChangePassword` components

### 4. Features Implemented

#### Profile Picture Display
- Shows at top of sidebar (same as therapist dashboard)
- Displays uploaded image or default orange avatar
- Clickable to open profile menu

#### Profile Menu Dropdown
- Opens above profile box in sidebar
- Two options:
  1. Edit Profile → Opens AdminEditProfile
  2. Change/Forgot Password → Opens ChangePassword

#### Edit Profile
- Only 4 fields (simplified for admin):
  - Name
  - Email
  - Phone Number (with country code selector)
  - Profile Picture
- Image compression for large files
- Auto-refresh after successful save

#### Change/Forgot Password
- Reuses existing `ChangePassword` component
- Two tabs:
  1. Change Password (requires current password)
  2. Forgot Password (OTP flow - TODO backend)

## File Structure
```
components/
├── Dashboard.tsx (updated)
├── AdminEditProfile.tsx (new)
└── ChangePassword.tsx (reused)

server/
└── index.ts (added admin-profile endpoints)

scripts/
└── addAdminProfileColumns.ts (new migration)
```

## Testing Checklist
- [x] Database migration successful
- [x] No TypeScript errors
- [ ] Profile picture displays in sidebar
- [ ] Profile menu opens/closes correctly
- [ ] Edit Profile loads admin data
- [ ] Profile picture upload works
- [ ] Profile update saves correctly
- [ ] Change Password works
- [ ] Page refreshes after profile update

## Notes
- Profile picture stored in MinIO under 'profile-pictures' folder
- Image compression happens client-side before upload
- Max file size: 5MB (after compression)
- Forgot Password OTP flow marked as TODO (backend not implemented)
- Auto-refresh after profile save ensures profile picture updates in sidebar
