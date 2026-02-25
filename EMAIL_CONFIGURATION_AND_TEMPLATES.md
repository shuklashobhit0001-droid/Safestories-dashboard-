# 📧 Email Configuration & Templates for Forgot Password

## 🔧 Email Configuration

### Gmail SMTP Settings
The application uses Gmail SMTP to send emails. Configuration is in `.env.local`:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### How It Works:
1. **GMAIL_USER** - The Gmail address that will send the emails
2. **GMAIL_APP_PASSWORD** - Gmail App Password (not your regular password)
   - Generate at: https://myaccount.google.com/apppasswords
   - Requires 2FA enabled on Gmail account

### Email Service:
- **File:** `lib/email.ts`
- **Function:** `sendPasswordResetOTP()`
- **Transport:** Nodemailer with Gmail SMTP
- **Port:** 587 (TLS)

---

## 📨 Email Template: Password Reset OTP

### Email Details:
- **From:** "SafeStories" <your-gmail@gmail.com>
- **Subject:** 🔐 Password Reset OTP - SafeStories
- **Format:** HTML + Plain Text fallback

---

## 🎨 HTML Email Template Preview

### Header Section:
```
┌─────────────────────────────────────────┐
│                                         │
│     Password Reset Request              │
│     SafeStories Account Security        │
│                                         │
│  (Teal gradient background #21615D)    │
└─────────────────────────────────────────┘
```

### Body Content:
```
Hello [User Name],

We received a request to reset your password for your 
SafeStories account. To proceed with the password reset, 
please use the One-Time Password (OTP) below:

┌─────────────────────────────────────────┐
│         Your OTP Code                   │
│                                         │
│           123456                        │
│     (Large, bold, centered)             │
└─────────────────────────────────────────┘

📋 Next Steps:
1. Enter the OTP code above in the password reset form
2. Create a new strong password
3. Confirm your new password
4. Login with your new credentials

⏰ Important: This OTP will expire on 
   [Date and Time in IST]

🔒 Security Notice: If you didn't request this password 
   reset, please ignore this email and ensure your 
   account is secure. Your password will not be changed 
   unless you complete the reset process.

Best regards,
The SafeStories Team
```

### Footer:
```
─────────────────────────────────────────
This is an automated email. 
Please do not reply to this message.

© 2025 SafeStories. All rights reserved.
─────────────────────────────────────────
```

---

## 📝 Plain Text Email Template

For email clients that don't support HTML:

```
Hello [User Name],

We received a request to reset your password for your SafeStories account.

Your One-Time Password (OTP) for password reset is: 123456

This OTP will expire on [Date and Time in IST].

Next Steps:
1. Enter the OTP code in the password reset form
2. Create a new strong password
3. Confirm your new password
4. Login with your new credentials

Security Notice: If you didn't request this password reset, 
please ignore this email. Your password will not be changed 
unless you complete the reset process.

Best regards,
The SafeStories Team
```

---

## 🎨 Email Design Features

### Visual Elements:
- ✅ **Teal gradient header** (#21615D to #2d7a75)
- ✅ **Large OTP display** (42px, bold, letter-spaced)
- ✅ **Dashed border box** for OTP (professional look)
- ✅ **Color-coded sections:**
  - Yellow box for instructions (#fff8e1)
  - Red box for expiry warning (#ffebee)
  - Blue box for security notice (#e3f2fd)
- ✅ **Responsive design** (works on mobile)
- ✅ **Professional typography** (system fonts)

### Branding:
- ✅ SafeStories name and colors
- ✅ Consistent with existing therapist onboarding emails
- ✅ Professional and trustworthy appearance

---

## 🔐 Security Features in Email

### Information Included:
1. **OTP Code** - 6-digit numeric code
2. **Expiry Time** - Exact date/time in IST timezone
3. **Security Warning** - If user didn't request reset
4. **Clear Instructions** - Step-by-step guide

### Information NOT Included (Security):
- ❌ No clickable links (prevents phishing)
- ❌ No password hints
- ❌ No account details
- ❌ No direct login links

---

## ⏰ OTP Expiry Display

### Format:
```
This OTP will expire on:
Wednesday, February 19, 2025, 03:45 PM IST
```

### Timezone:
- **Always displayed in IST** (Asia/Kolkata)
- Consistent with your application timezone
- Clear timezone indicator

---

## 📊 Email Sending Flow

### When Email is Sent:
1. User requests password reset
2. Backend generates 6-digit OTP
3. Backend stores OTP in database with 10-minute expiry
4. Backend calls `sendPasswordResetOTP()` function
5. Email sent via Gmail SMTP
6. User receives email within seconds

### Success Indicators:
```javascript
console.log('✅ Password reset email sent successfully:', info.messageId);
```

### Error Handling:
```javascript
console.error('❌ Error sending password reset email:', error);
throw new Error('Failed to send password reset email');
```

---

## 🧪 Testing Email Delivery

### Test Steps:
1. Request password reset from login page
2. Check server logs for:
   ```
   🔐 Password reset OTP request for: user@example.com
   ✅ Password reset OTP sent to: user@example.com
   ```
3. Check email inbox (may take 5-30 seconds)
4. Check spam folder if not received
5. Verify OTP matches what's in database

### Troubleshooting:

#### Email Not Received:
- ✅ Check `.env.local` has correct Gmail credentials
- ✅ Check Gmail App Password is valid
- ✅ Check spam/junk folder
- ✅ Check server logs for errors
- ✅ Verify internet connection

#### "Failed to send email" Error:
- ✅ Verify Gmail App Password (not regular password)
- ✅ Ensure 2FA is enabled on Gmail
- ✅ Check Gmail hasn't blocked the app
- ✅ Try regenerating App Password

---

## 📧 Email Examples

### Example 1: Admin User
```
From: SafeStories <your-gmail@gmail.com>
To: admin@safestories.com
Subject: 🔐 Password Reset OTP - SafeStories

Hello Admin User,

We received a request to reset your password...

Your OTP Code: 847392

This OTP will expire on: Wednesday, February 19, 2025, 03:45 PM IST
```

### Example 2: Therapist User
```
From: SafeStories <your-gmail@gmail.com>
To: therapist@example.com
Subject: 🔐 Password Reset OTP - SafeStories

Hello Dr. Smith,

We received a request to reset your password...

Your OTP Code: 562819

This OTP will expire on: Wednesday, February 19, 2025, 04:15 PM IST
```

---

## 🔄 Email vs Existing Therapist Onboarding Email

### Similarities:
- ✅ Same Gmail SMTP configuration
- ✅ Same SafeStories branding
- ✅ Same teal color scheme
- ✅ Same professional design
- ✅ Same email service (`lib/email.ts`)

### Differences:
- 🔄 **Subject:** "Password Reset OTP" vs "Profile Setup OTP"
- 🔄 **Purpose:** Reset password vs Complete profile
- 🔄 **Instructions:** Different steps
- 🔄 **Tone:** Security-focused vs Welcome-focused

---

## 📝 Email Content Customization

### Dynamic Variables:
```typescript
sendPasswordResetOTP(
  email: string,        // User's email address
  userName: string,     // User's full name or username
  otp: string,          // 6-digit OTP code
  expiresAt: Date       // Expiry timestamp
)
```

### Personalization:
- User's name in greeting
- Exact expiry time
- User's email address (for verification)

---

## 🚀 Production Considerations

### Before Going Live:
1. ✅ Verify Gmail credentials in `.env.local`
2. ✅ Test email delivery to multiple providers (Gmail, Outlook, Yahoo)
3. ✅ Check spam score (use mail-tester.com)
4. ✅ Ensure 2FA is enabled on Gmail account
5. ✅ Monitor email sending logs
6. ✅ Set up email delivery monitoring

### Email Deliverability:
- ✅ Using Gmail SMTP (high deliverability)
- ✅ No suspicious links (reduces spam score)
- ✅ Professional content (not marketing)
- ✅ Clear sender name "SafeStories"
- ✅ Proper HTML structure

---

## 📊 Email Statistics to Monitor

### Track:
- Total emails sent
- Successful deliveries
- Failed deliveries
- Average delivery time
- Spam complaints (if any)

### Logs to Check:
```bash
# Server logs show:
🔐 Password reset OTP request for: user@example.com
✅ Password reset OTP sent to: user@example.com
✅ Email sent successfully: <message-id>
```

---

## 🔐 Security Best Practices

### Email Security:
- ✅ No clickable password reset links (prevents phishing)
- ✅ OTP expires in 10 minutes
- ✅ Clear security warnings
- ✅ No sensitive information in email
- ✅ Encourages users to verify request

### Gmail Account Security:
- ✅ Use App Password (not regular password)
- ✅ Enable 2FA on Gmail account
- ✅ Monitor Gmail security alerts
- ✅ Rotate App Password periodically

---

## 📞 Support Information

### If Users Don't Receive Email:
1. Check spam/junk folder
2. Wait 1-2 minutes (delivery delay)
3. Request new OTP (old one expires)
4. Verify email address is correct
5. Contact support if issue persists

### Support Email Template:
```
Subject: Password Reset Email Not Received

Hello,

I requested a password reset but didn't receive the OTP email.

Email address: [user's email]
Time of request: [timestamp]
Checked spam folder: Yes/No

Please assist.

Thank you,
[User Name]
```

---

**Ready to proceed with testing the email functionality?**

Let me know if you want to:
1. Test sending an email now
2. Modify the email template
3. Change any email settings
4. Add more information to the email
