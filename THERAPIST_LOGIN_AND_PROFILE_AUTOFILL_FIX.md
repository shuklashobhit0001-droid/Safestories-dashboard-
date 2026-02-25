# Therapist Login & Profile Auto-fill Implementation ✅

## Problems Identified

### Problem 1: No Login After Profile Submission
After therapist completed their profile form (with password), they couldn't login using email + password because:
- Password was saved in `therapist_details` table only
- No user account was created in `users` table
- Login system checks `users` table for authentication

### Problem 2: Edit Profile Not Auto-filled
When therapist clicked "Edit Profile" after completing the profile form:
- Form was empty (not pre-filled with submitted data)
- Data was in `therapist_details` table but API only checked `therapists` table
- Therapist had to re-enter all information

## Solutions Implemented

### Solution 1: Create User Account on Profile Submission

Updated `/api/complete-therapist-profile` endpoint in `server/index.ts`:

```typescript
// After saving to therapist_details table
// Create user account for login (email + password)
console.log('👤 Creating user account...');
try {
  // Check if user already exists
  const existingUser = await pool.query(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (existingUser.rows.length === 0) {
    // Create new user account
    await pool.query(
      `INSERT INTO users (username, email, password, role, full_name, phone, profile_picture_url, created_at)
       VALUES ($1, $2, $3, 'therapist', $4, $5, $6, NOW())`,
      [email, email, password, name, phone, profilePictureUrl]
    );
    console.log('✅ User account created for:', email);
  } else {
    // Update existing user with new password
    await pool.query(
      `UPDATE users SET password = $1, full_name = $2, phone = $3, profile_picture_url = $4 
       WHERE LOWER(email) = LOWER($5)`,
      [password, name, phone, profilePictureUrl, email]
    );
    console.log('✅ User account updated for:', email);
  }
} catch (userError) {
  console.error('⚠️ Error creating user account:', userError);
  // Continue anyway - profile is saved, user can be created later by admin
}
```

**What this does:**
- Creates user account in `users` table with role='therapist'
- Uses email as both username and email
- Stores the password they entered in the profile form
- If user already exists, updates their password and details
- Therapist can now login with email + password immediately

### Solution 2: Fetch Profile from therapist_details Table

Updated `/api/therapist-profile` endpoint to check both tables:

```typescript
app.get('/api/therapist-profile', async (req, res) => {
  try {
    const { therapist_id, email } = req.query;

    // First try to get from therapists table (approved therapists)
    let result;
    if (therapist_id) {
      result = await pool.query(
        `SELECT * FROM therapists WHERE therapist_id = $1`,
        [therapist_id]
      );
    }

    // If not found in therapists table, check therapist_details (pending approval)
    if (!result || result.rows.length === 0) {
      if (email) {
        result = await pool.query(
          `SELECT * FROM therapist_details WHERE LOWER(email) = LOWER($1) ORDER BY created_at DESC LIMIT 1`,
          [email]
        );
        
        if (result.rows.length > 0) {
          // Map therapist_details fields to match therapists table structure
          const details = result.rows[0];
          const mappedData = {
            therapist_id: null,
            name: details.name,
            contact_info: details.email,
            email: details.email,
            phone_number: details.phone,
            specialization: details.specializations,
            specialization_details: details.specialization_details,
            qualification: details.qualification,
            qualification_pdf_url: details.qualification_pdf_url,
            profile_picture_url: details.profile_picture_url,
            status: details.status
          };
          return res.json({ success: true, data: mappedData });
        }
      }
    }

    res.json({ success: true, data: result.rows[0] });
  }
});
```

**What this does:**
- First checks `therapists` table (for approved therapists)
- If not found, checks `therapist_details` table (for pending therapists)
- Maps field names to match expected structure
- Returns data from whichever table has it

### Solution 3: Update EditProfile to Use Email Fallback

Updated `components/EditProfile.tsx` to fetch by email if therapist_id not available:

```typescript
const fetchTherapistProfile = async () => {
  try {
    setLoading(true);
    // Try with therapist_id first, fallback to email for pending therapists
    const url = user.therapist_id 
      ? `/api/therapist-profile?therapist_id=${user.therapist_id}`
      : `/api/therapist-profile?email=${encodeURIComponent(user.email)}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      const profile = data.data;
      setName(profile.name || '');
      setEmail(profile.contact_info || profile.email || '');
      
      // Extract country code and phone
      const phoneStr = profile.phone_number || profile.phone || '';
      const phoneMatch = phoneStr.match(/^(\+\d{1,3})\s*(.+)$/);
      if (phoneMatch) {
        setCountryCode(phoneMatch[1]);
        setPhone(phoneMatch[2]);
      }

      // Parse specializations and details
      if (profile.specialization || profile.specializations) {
        const specs = (profile.specialization || profile.specializations).split(', ');
        setSpecializations(specs);
        
        // Parse specialization details JSON
        let parsedDetails: any = {};
        if (profile.specialization_details) {
          const detailsArray = typeof profile.specialization_details === 'string'
            ? JSON.parse(profile.specialization_details)
            : profile.specialization_details;
          
          if (Array.isArray(detailsArray)) {
            detailsArray.forEach((item: any) => {
              parsedDetails[item.name] = {
                price: item.price || '',
                description: item.description || ''
              };
            });
          }
        }
        
        setSpecializationDetails(parsedDetails);
      }

      setQualification(profile.qualification || '');
      setCurrentQualificationUrl(profile.qualification_pdf_url || '');
      setCurrentProfilePictureUrl(profile.profile_picture_url || '');
    }
  }
};
```

**What this does:**
- Uses therapist_id if available (approved therapists)
- Falls back to email if no therapist_id (pending therapists)
- Handles both field name variations (phone_number vs phone, etc.)
- Parses specialization_details JSON correctly
- Auto-fills all form fields with submitted data

## Complete Flow

### New Therapist Onboarding Flow:
1. Admin adds therapist request → OTP sent
2. Therapist logs in with email + OTP
3. Dashboard shows "Complete Profile" modal
4. Therapist fills form with password
5. **Submits form:**
   - Data saved to `therapist_details` table ✅
   - User account created in `users` table ✅
   - Status: 'pending_review'
6. Success modal shows
7. Clicks "Go to Dashboard"
8. Dashboard shows with "Profile Under Review" banner

### Login After Logout:
1. Therapist logs out
2. Goes to login page
3. **Enters email + password** ✅
4. Logs in successfully
5. Dashboard shows with banner (no modal)

### Edit Profile:
1. Therapist clicks "Edit Profile"
2. **Form auto-fills with all submitted data** ✅
   - Name, email, phone
   - Specializations with prices & descriptions
   - Qualification
   - Profile picture
3. Can make changes and save

## Files Modified

1. **server/index.ts**
   - Updated `/api/complete-therapist-profile` to create user account
   - Updated `/api/therapist-profile` to check both tables
   - Fixed TypeScript type issues

2. **components/EditProfile.tsx**
   - Updated `fetchTherapistProfile` to use email fallback
   - Enhanced parsing of specialization details
   - Handles both field name variations

## Testing Steps

1. **Test Login After Profile Submission:**
   - Complete profile form with password "Test1234"
   - Logout
   - Login with email + "Test1234" ✅
   - Should login successfully

2. **Test Edit Profile Auto-fill:**
   - Login as new therapist (pending approval)
   - Click "Edit Profile"
   - ✅ All fields should be pre-filled:
     - Name
     - Email
     - Phone with country code
     - Specializations checked
     - Prices and descriptions filled
     - Qualification text
     - Profile picture shown

3. **Test After Admin Approval:**
   - Admin approves therapist
   - Data moved to `therapists` table
   - Therapist logs in
   - Edit Profile still works ✅
   - Fetches from `therapists` table now

## Database Tables

### therapist_details (Pending Approval)
- Stores profile submissions
- Status: 'pending_review'
- Has password field

### users (Login Accounts)
- Created when profile submitted
- Role: 'therapist'
- Email + password for login

### therapists (Approved)
- Created by admin after approval
- Has therapist_id
- Active therapists

## Status
✅ COMPLETE - Both issues fixed:
1. Therapists can login with email + password after profile submission
2. Edit Profile form auto-fills with submitted data
