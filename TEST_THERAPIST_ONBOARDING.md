# Test Guide: Therapist Onboarding Flow

## Prerequisites
- Frontend server running on port 3004
- API server running on port 3002
- Gmail SMTP configured in .env.local
- Database tables created

## Test Steps

### Step 1: Add New Therapist (Admin)
1. Login as admin
2. Go to "All Therapists" section
3. Click "Add New Therapist"
4. Fill in the form:
   - Name: Test Therapist
   - Email: your-test-email@gmail.com
   - WhatsApp: +91 9876543210
   - Specializations: Individual Therapy
   - Price: 1500
   - Description: Test description
5. Click "Send Request"
6. **Expected**: Success message appears

### Step 2: Check Email
1. Open the email inbox for the email you entered
2. **Expected**: Email with subject "Welcome to SafeStories - Complete Your Profile"
3. **Expected**: Email contains 6-digit OTP
4. Copy the OTP

### Step 3: Login with OTP
1. Go to login page (http://localhost:3004)
2. Click "First Time Login?"
3. Enter email address
4. Enter the 6-digit OTP
5. Click "Verify OTP"
6. **Expected**: Login successful

### Step 4: Dashboard with Modal
1. **Expected**: Dashboard loads
2. **Expected**: Dashboard background is blurred
3. **Expected**: "Complete Your Profile" modal appears automatically
4. **Expected**: Modal cannot be closed (no X button works)
5. **Expected**: Form is pre-filled with:
   - Name
   - Email
   - Phone number
   - Specializations (checked)
   - Prices and descriptions

### Step 5: Complete Profile
1. Review pre-filled data
2. Add/modify any fields:
   - Qualification (optional)
   - Upload qualification PDF (optional)
   - Upload profile picture (optional)
3. Create password (min 8 chars, uppercase, lowercase, number)
4. Confirm password
5. Click "Save Changes"
6. **Expected**: Loading state shows
7. **Expected**: No errors in console

### Step 6: Success Modal
1. **Expected**: Success modal appears
2. **Expected**: Shows 🎉 emoji
3. **Expected**: Heading: "Profile Submitted Successfully!"
4. **Expected**: Message about 5-10 days review
5. **Expected**: "Go to Dashboard" button visible
6. Click "Go to Dashboard"
7. **Expected**: Page reloads

### Step 7: Verify Database
1. Check `therapists` table:
   - New row with therapist data
   - `is_profile_complete` = true
   - `contact_info` has email
   - `specialization_details` has JSON data
2. Check `users` table:
   - New row with username (email prefix)
   - Password stored
   - `role` = 'therapist'
   - `therapist_id` matches therapists table
3. Check `new_therapist_requests` table:
   - Status changed to 'completed'

### Step 8: Login with Credentials
1. Logout
2. Go to login page
3. Enter username (email prefix or full email)
4. Enter password you created
5. Click "Log In"
6. **Expected**: Login successful
7. **Expected**: Dashboard loads normally
8. **Expected**: No modal appears (profile already complete)

## Common Issues & Solutions

### Issue: OTP Email Not Received
- **Check**: Gmail credentials in .env.local
- **Check**: Server logs for email sending errors
- **Solution**: Restart API server (port 3002)

### Issue: 500 Error on OTP Verification
- **Check**: Server logs for specific error
- **Check**: Database connection
- **Solution**: Verify `new_therapist_requests` table has the request

### Issue: 500 Error on Profile Completion
- **Check**: Server logs for database errors
- **Check**: Therapists table has all required columns
- **Solution**: Verify column names match (contact_info, not email)

### Issue: Modal Not Appearing
- **Check**: User object has `needsProfileCompletion: true`
- **Check**: Console for React errors
- **Solution**: Verify LoginForm.tsx passes the flag correctly

### Issue: Dashboard Not Blurred
- **Check**: CSS classes applied correctly
- **Check**: Modal state is true
- **Solution**: Verify blur wrapper div is present

## Success Criteria

✅ OTP email received within 30 seconds
✅ OTP verification successful
✅ Dashboard loads with blurred background
✅ Modal appears automatically
✅ Form pre-filled with correct data
✅ Profile submission successful
✅ Success modal appears with correct message
✅ Page reloads after clicking button
✅ Database updated correctly
✅ Can login with new credentials
✅ No modal on subsequent logins

## Test Data

### Test Therapist 1:
- Name: Dr. Sarah Johnson
- Email: sarah.johnson@example.com
- Phone: +91 9876543210
- Specialization: Individual Therapy
- Price: 2000

### Test Therapist 2:
- Name: Dr. Raj Patel
- Email: raj.patel@example.com
- Phone: +91 9876543211
- Specializations: Individual Therapy, Couples Therapy
- Prices: 2000, 3000

### Test Therapist 3:
- Name: Dr. Emily Chen
- Email: emily.chen@example.com
- Phone: +91 9876543212
- Specializations: All three
- Prices: 1800, 1500, 3500

## Notes

- OTP expires in 24 hours
- Password must meet requirements
- Profile picture max 2MB
- Qualification PDF max 5MB
- Specialization details stored as JSON
- Email stored in `contact_info` column
- Username is email prefix (before @)

## Troubleshooting Commands

```bash
# Check if servers are running
lsof -i :3004  # Frontend
lsof -i :3002  # API

# Restart API server
# (Stop current process and restart)

# Check database
psql -d your_database -c "SELECT * FROM new_therapist_requests WHERE status = 'pending';"
psql -d your_database -c "SELECT * FROM therapists ORDER BY created_at DESC LIMIT 5;"
psql -d your_database -c "SELECT * FROM users WHERE role = 'therapist' ORDER BY id DESC LIMIT 5;"

# Check server logs
# Look for errors in terminal running API server
```

---

**Ready to test! Follow the steps above and verify each expected result.** 🚀
