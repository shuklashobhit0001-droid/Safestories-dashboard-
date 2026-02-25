# 🔧 Email Not Received - Troubleshooting Guide

## ✅ Good News!

The email configuration is working! I just tested it and the email was sent successfully.

**Test Result:**
- ✅ Email sent to: shuklashobhit0001@gmail.com
- ✅ OTP: 789012
- ✅ Message ID: 4e9e0a41-122e-f755-a6f1-b2113e2a5680@gmail.com

---

## 🔄 The Issue: Server Needs Restart

The problem is that your development server was started BEFORE we added the Gmail credentials to `.env.local`.

**The server needs to be restarted to load the new environment variables.**

---

## 🚀 Solution: Restart Your Server

### Step 1: Stop the Server
In your terminal where the server is running, press:
```
Ctrl + C
```

### Step 2: Start the Server Again
```bash
npm run dev
```

### Step 3: Test Forgot Password
1. Go to your login page
2. Click "Forgot Your Password?"
3. Enter: shuklashobhit0001@gmail.com
4. Click "Send OTP"
5. Check your email inbox

---

## 📧 Check Your Email

After restarting the server, check:

1. **Inbox** - Look for "Password Reset OTP - SafeStories"
2. **Spam/Junk Folder** - Gmail might filter it
3. **Promotions Tab** - If using Gmail tabs
4. **Wait 1-2 minutes** - Delivery can take time

---

## 🧪 Quick Test

You can also test the email directly without the server:

```bash
npx tsx test_email_with_env.ts
```

This will send a test email to shuklashobhit0001@gmail.com with OTP: 789012

---

## 📊 What's Configured

### Environment Variables in .env.local:
```env
GMAIL_USER=shuklashobhit0001@gmail.com
GMAIL_APP_PASSWORD=nayn mqkd hatq htfd
```

### Email Service:
- ✅ Gmail SMTP configured
- ✅ Port 587 (TLS)
- ✅ Nodemailer installed
- ✅ Email template ready
- ✅ Test successful

---

## 🔍 How to Verify Server Loaded Config

After restarting the server, you can check the server logs when sending OTP:

**Look for these messages:**
```
🔐 Password reset OTP request for: user@example.com
✅ Password reset OTP sent to: user@example.com
✅ Email sent successfully: <message-id>
```

**If you see error messages:**
```
❌ Error sending password reset email: [error details]
```

Then the server might not have loaded the environment variables correctly.

---

## 🐛 If Still Not Working After Restart

### 1. Check Server Logs
Look for any error messages in the terminal where the server is running.

### 2. Verify Environment Variables Loaded
Add this to your server startup to verify:
```typescript
console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Configured' : 'NOT SET');
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'NOT SET');
```

### 3. Check .env.local File
Make sure the file is in the root directory and has the correct format:
```env
GMAIL_USER=shuklashobhit0001@gmail.com
GMAIL_APP_PASSWORD=nayn mqkd hatq htfd
```

### 4. Check for Spaces
Make sure there are no extra spaces in the .env.local file:
- ❌ `GMAIL_USER = email@gmail.com` (spaces around =)
- ✅ `GMAIL_USER=email@gmail.com` (no spaces)

---

## 📝 Common Issues

### Issue 1: "OTP sent" but no email
**Cause:** Server not restarted after adding credentials
**Solution:** Restart the server

### Issue 2: Email in spam folder
**Cause:** Gmail filtering
**Solution:** Check spam folder, add sender to contacts

### Issue 3: Delayed delivery
**Cause:** Email server delay
**Solution:** Wait 1-2 minutes, check spam folder

### Issue 4: Wrong email address
**Cause:** Typo in email address
**Solution:** Verify email address is correct

---

## ✅ Expected Behavior After Restart

### When you click "Send OTP":
1. Frontend shows: "OTP sent to your email!"
2. Server logs show: "✅ Password reset OTP sent to: [email]"
3. Email arrives within 5-30 seconds
4. Email subject: "🔐 Password Reset OTP - SafeStories"
5. Email contains 6-digit OTP

### Email Content:
```
Hello [Your Name],

We received a request to reset your password...

Your OTP Code: 123456

This OTP will expire on: [Date and Time]
```

---

## 🎯 Quick Checklist

Before testing again:
- [ ] Server restarted (Ctrl+C then npm run dev)
- [ ] .env.local file has Gmail credentials
- [ ] No extra spaces in .env.local
- [ ] Email address is correct
- [ ] Checked spam folder
- [ ] Waited 1-2 minutes for delivery

---

## 📞 Still Having Issues?

If the email still doesn't arrive after restarting:

1. **Run the test script:**
   ```bash
   npx tsx test_email_with_env.ts
   ```
   This will show if email sending works at all.

2. **Check server logs** for error messages

3. **Verify Gmail credentials** are correct

4. **Check Gmail account** hasn't blocked the app

5. **Try a different email address** to test

---

## 🎉 Summary

**The email system is working!** You just need to:

1. **Restart your development server** (Ctrl+C then npm run dev)
2. **Test forgot password** again
3. **Check your email** (including spam folder)

The test I just ran successfully sent an email, so once you restart the server, it will work from the UI too!

---

**Need help?** Let me know if you see any error messages after restarting the server!
