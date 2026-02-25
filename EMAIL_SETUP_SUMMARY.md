# 📧 Email Setup Summary for Forgot Password

## 🔧 Email Configuration

### Current Setup:
Your application uses **Gmail SMTP** to send password reset emails.

### Configuration File:
**Location:** `.env.local` (in your project root)

### Required Variables:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

---

## 📨 What Email Will Be Sent

### Email Details:
- **From:** "SafeStories" <your-configured-gmail@gmail.com>
- **Subject:** 🔐 Password Reset OTP - SafeStories
- **Format:** Professional HTML email with plain text fallback

---

## 🎨 Email Template Preview

### Visual Layout:

```
┌────────────────────────────────────────────────────┐
│                                                    │
│         Password Reset Request                     │
│         SafeStories Account Security               │
│                                                    │
│         (Teal gradient header)                     │
└────────────────────────────────────────────────────┘

Hello [User Name],

We received a request to reset your password for your 
SafeStories account. To proceed with the password reset, 
please use the One-Time Password (OTP) below:

┌────────────────────────────────────────────────────┐
│              Your OTP Code                         │
│                                                    │
│                 123456                             │
│         (Large, bold, centered)                    │
└────────────────────────────────────────────────────┘

📋 Next Steps:
1. Enter the OTP code above in the password reset form
2. Create a new strong password
3. Confirm your new password
4. Login with your new credentials

⏰ Important: This OTP will expire on 
   Wednesday, February 19, 2025, 03:45 PM IST

🔒 Security Notice: If you didn't request this password 
   reset, please ignore this email and ensure your 
   account is secure. Your password will not be changed 
   unless you complete the reset process.

Best regards,
The SafeStories Team

────────────────────────────────────────────────────
This is an automated email. Please do not reply.
© 2025 SafeStories. All rights reserved.
────────────────────────────────────────────────────
```

---

## 📝 Plain Text Version

For email clients that don't support HTML:

```
Hello [User Name],

We received a request to reset your password for your 
SafeStories account.

Your One-Time Password (OTP) for password reset is: 123456

This OTP will expire on Wednesday, February 19, 2025, 03:45 PM IST.

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

### Professional Design:
- ✅ **SafeStories branding** with teal colors (#21615D)
- ✅ **Large, clear OTP display** (42px font, bold)
- ✅ **Color-coded sections:**
  - 🟡 Yellow box for instructions
  - 🔴 Red box for expiry warning
  - 🔵 Blue box for security notice
- ✅ **Mobile responsive** design
- ✅ **Professional typography**

### Security Features:
- ✅ No clickable links (prevents phishing)
- ✅ Clear expiry time in IST
- ✅ Security warning if user didn't request
- ✅ Step-by-step instructions

---

## 🔐 Email Content Details

### Dynamic Information:
1. **User's Name** - Personalized greeting
2. **6-Digit OTP** - Randomly generated, secure
3. **Expiry Time** - Exact date/time in IST timezone
4. **User's Email** - Shown for verification

### Static Information:
- SafeStories branding
- Instructions
- Security warnings
- Support information

---

## ⏰ OTP Details

### OTP Specifications:
- **Format:** 6-digit numeric code (e.g., 847392)
- **Validity:** 10 minutes from generation
- **Usage:** Single-use only
- **Display:** Large, bold, centered in email

### Expiry Display Example:
```
This OTP will expire on:
Wednesday, February 19, 2025, 03:45 PM IST
```

---

## 📧 Email Sending Process

### When Email is Sent:
1. User clicks "Forgot Password"
2. User enters email address
3. System generates 6-digit OTP
4. System stores OTP in database (expires in 10 min)
5. System sends email via Gmail SMTP
6. User receives email (usually within 5-30 seconds)

### Server Logs:
```
🔐 Password reset OTP request for: user@example.com
✅ Password reset OTP sent to: user@example.com
✅ Email sent successfully: <message-id>
```

---

## 🔧 Gmail SMTP Configuration

### How to Set Up Gmail App Password:

1. **Enable 2FA on Gmail:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "SafeStories App"
   - Copy the 16-character password

3. **Add to .env.local:**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Important Notes:
- ⚠️ Use **App Password**, NOT your regular Gmail password
- ⚠️ 2FA must be enabled on Gmail account
- ⚠️ Keep App Password secure (don't commit to Git)

---

## 🧪 Testing Email Delivery

### Test Steps:
1. Go to login page
2. Click "Forgot Your Password?"
3. Enter your email address
4. Click "Send OTP"
5. Check your email inbox (5-30 seconds)
6. Check spam folder if not received

### What to Verify:
- ✅ Email received
- ✅ OTP is 6 digits
- ✅ Expiry time is shown
- ✅ Email looks professional
- ✅ All links/buttons work
- ✅ Mobile display is good

---

## 🐛 Troubleshooting

### Email Not Received:
1. **Check spam/junk folder** - Gmail may filter it
2. **Wait 1-2 minutes** - Delivery can be delayed
3. **Check server logs** - Look for errors
4. **Verify email address** - Make sure it's correct
5. **Check Gmail credentials** - Verify .env.local

### "Failed to send email" Error:
1. **Verify App Password** - Not regular password
2. **Check 2FA enabled** - Required for App Password
3. **Regenerate App Password** - Old one may be invalid
4. **Check internet connection** - Server needs internet
5. **Check Gmail limits** - Gmail has sending limits

### Common Issues:
| Issue | Solution |
|-------|----------|
| Email in spam | Add sender to contacts |
| Wrong OTP | Request new OTP |
| OTP expired | Request new OTP (10 min limit) |
| No email received | Check .env.local configuration |
| "Invalid credentials" | Use App Password, not regular password |

---

## 📊 Email Examples

### Example 1: Admin User
```
From: SafeStories <your-gmail@gmail.com>
To: admin@safestories.com
Subject: 🔐 Password Reset OTP - SafeStories

Hello Admin User,

Your OTP Code: 847392

Expires: Wednesday, February 19, 2025, 03:45 PM IST
```

### Example 2: Therapist User
```
From: SafeStories <therapist-email@gmail.com>
To: therapist@example.com
Subject: 🔐 Password Reset OTP - SafeStories

Hello Dr. Smith,

Your OTP Code: 562819

Expires: Wednesday, February 19, 2025, 04:15 PM IST
```

---

## 🔐 Security Features

### Email Security:
- ✅ No clickable password reset links
- ✅ OTP expires in 10 minutes
- ✅ Single-use OTP
- ✅ Clear security warnings
- ✅ No sensitive account information

### Rate Limiting:
- ✅ Max 3 OTP requests per hour per email
- ✅ Prevents spam/abuse
- ✅ Tracked in database

---

## 📝 Next Steps

### To Start Using:
1. ✅ Database tables created (already done)
2. ✅ Backend APIs implemented (already done)
3. ✅ Frontend connected (already done)
4. ✅ Email template ready (already done)
5. ⚠️ **Verify Gmail credentials in .env.local**
6. 🧪 **Test email delivery**

### Testing Checklist:
- [ ] Verify .env.local has Gmail credentials
- [ ] Test from login page
- [ ] Test from admin dashboard
- [ ] Test from therapist dashboard
- [ ] Verify email received
- [ ] Verify OTP works
- [ ] Test password reset
- [ ] Test rate limiting

---

## 📞 Support

### If Users Report Issues:
1. Check server logs for errors
2. Verify email was sent successfully
3. Check spam folder
4. Verify OTP hasn't expired (10 min)
5. Request new OTP if needed

---

**Ready to proceed with testing?**

The email system is fully configured and ready to use. Just verify your Gmail credentials in `.env.local` and test!
