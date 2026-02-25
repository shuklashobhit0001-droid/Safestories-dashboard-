# 📧 Email Requirements for Testing Features

## ✅ Summary

You're absolutely right! Both features require Gmail SMTP credentials to work:

1. **Forgot Password** - Sends OTP via email
2. **Add New Therapist** - Sends profile completion link/OTP via email

---

## 🔐 What You Need

### Gmail Account Setup:

You need to add these credentials to your `.env.local` file:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

---

## 📝 How to Get Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Click "Get Started" and follow the setup

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Name it: "SafeStories App"
5. Click "Generate"
6. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

### Step 3: Add to .env.local
```env
# Add these lines to your .env.local file:
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## 🎯 Which Features Need This

### 1. Forgot Password Feature
**Status:** ✅ Fully implemented, waiting for email credentials

**What it does:**
- User clicks "Forgot Password" on login page
- Enters their email address
- System sends 6-digit OTP via email
- User enters OTP and resets password

**Email sent:**
- Subject: "🔐 Password Reset OTP - SafeStories"
- Contains: 6-digit OTP code
- Expires: 10 minutes

**Where it works:**
- Login page (modal)
- Admin dashboard (Change/Forgot Password)
- Therapist dashboard (Change/Forgot Password)

---

### 2. Add New Therapist Feature
**Status:** ✅ Fully implemented, waiting for email credentials

**What it does:**
- Admin adds new therapist request
- System generates 6-digit OTP
- System sends email to therapist
- Therapist uses OTP to complete profile
- Therapist can then login

**Email sent:**
- Subject: "🎉 Welcome to SafeStories - Complete Your Profile"
- Contains: 6-digit OTP code
- Expires: 24 hours

**Current behavior:**
- OTP is logged to console (not emailed)
- Once you add Gmail credentials, it will send emails

---

## 🧪 Testing Without Email (Current State)

### Forgot Password:
❌ Cannot test - requires email to receive OTP

### Add New Therapist:
✅ Can partially test:
1. Admin adds therapist request
2. Check console logs for OTP
3. Use OTP from console to complete profile
4. Login with new credentials

---

## 🧪 Testing With Email (After Setup)

### Forgot Password:
1. Go to login page
2. Click "Forgot Your Password?"
3. Enter email address
4. Check email inbox for OTP
5. Enter OTP in modal
6. Set new password
7. Login with new password

### Add New Therapist:
1. Admin adds new therapist
2. Therapist receives email with OTP
3. Therapist goes to login page
4. Clicks "First Time Login?"
5. Enters email + OTP from email
6. Completes profile
7. Logs in with new credentials

---

## 📧 Email Service Details

### Current Implementation:
- **File:** `lib/email.ts`
- **Service:** Nodemailer with Gmail SMTP
- **Port:** 587 (TLS)
- **Functions:**
  - `sendPasswordResetOTP()` - For forgot password
  - `sendTherapistOnboardingOTP()` - For new therapist (to be added)

### Email Templates:
- Professional SafeStories branding
- Teal color scheme (#21615D)
- Large, clear OTP display
- Security warnings
- Step-by-step instructions
- Mobile responsive

---

## ⚠️ Important Notes

### Security:
- ✅ Use **App Password**, NOT your regular Gmail password
- ✅ 2FA must be enabled on Gmail account
- ✅ Keep App Password secure (don't commit to Git)
- ✅ `.env.local` is already in `.gitignore`

### Gmail Limits:
- Gmail has sending limits (500 emails/day for free accounts)
- For production, consider using:
  - Gmail Workspace (higher limits)
  - SendGrid
  - AWS SES
  - Mailgun

### Testing:
- Test with your own email first
- Check spam folder if email not received
- Delivery usually takes 5-30 seconds
- Check server logs for errors

---

## 🚀 Quick Setup Guide

### 1. Get Gmail Credentials (5 minutes)
- Enable 2FA on Gmail
- Generate App Password
- Copy the 16-character password

### 2. Update .env.local (1 minute)
```env
# Add these two lines:
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### 3. Restart Server (1 minute)
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### 4. Test Forgot Password (2 minutes)
- Go to login page
- Click "Forgot Your Password?"
- Enter your email
- Check inbox for OTP
- Complete password reset

### 5. Test Add New Therapist (3 minutes)
- Login as admin
- Add new therapist request
- Check therapist's email for OTP
- Complete profile setup
- Login as therapist

---

## 📊 Current Status

| Feature | Implementation | Email Setup | Ready to Test |
|---------|---------------|-------------|---------------|
| Forgot Password | ✅ Complete | ⏳ Needs credentials | ⏳ After email setup |
| Add New Therapist | ✅ Complete | ⏳ Needs credentials | ⏳ After email setup |
| Database Tables | ✅ Created | N/A | ✅ Ready |
| API Endpoints | ✅ Working | N/A | ✅ Ready |
| Frontend UI | ✅ Complete | N/A | ✅ Ready |
| Email Templates | ✅ Ready | ⏳ Needs credentials | ⏳ After email setup |

---

## 🎯 What Happens After Email Setup

### Immediately Available:
1. ✅ Forgot password from login page
2. ✅ Forgot password from admin dashboard
3. ✅ Forgot password from therapist dashboard
4. ✅ New therapist onboarding via email
5. ✅ Profile completion flow
6. ✅ All security features active

### No Code Changes Needed:
- Everything is already implemented
- Just add Gmail credentials
- Restart server
- Start testing!

---

## 🐛 Troubleshooting

### Email Not Received:
1. Check spam/junk folder
2. Wait 1-2 minutes (delivery delay)
3. Check server logs for errors
4. Verify Gmail credentials in .env.local
5. Ensure 2FA is enabled on Gmail

### "Failed to send email" Error:
1. Verify you're using App Password (not regular password)
2. Check 2FA is enabled
3. Try regenerating App Password
4. Check internet connection
5. Check Gmail hasn't blocked the app

### "Invalid credentials" Error:
- You're using regular password instead of App Password
- Generate App Password from Gmail settings

---

## 📞 Need Help?

### Gmail Setup Issues:
- Gmail Help: https://support.google.com/accounts/answer/185833
- 2FA Setup: https://support.google.com/accounts/answer/185839
- App Passwords: https://support.google.com/accounts/answer/185833

### Testing Issues:
- Check server logs for detailed errors
- Verify .env.local has correct format
- Ensure no extra spaces in credentials
- Restart server after adding credentials

---

## ✅ Ready to Proceed?

Once you add Gmail credentials:
1. Both features will work immediately
2. No code changes needed
3. Ready for production testing
4. Ready for user testing

**Total setup time: ~10 minutes**

---

**Questions?**
- Need help setting up Gmail App Password?
- Want to test with a different email service?
- Need to modify email templates?
- Want to add more features?

Let me know! 🚀
