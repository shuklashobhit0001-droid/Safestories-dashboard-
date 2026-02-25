# 🚀 Forgot Password Setup Instructions

## Step 1: Run Database Migration

Open your terminal and run:

```bash
tsx scripts/createPasswordResetTables.ts
```

**Expected Output:**
```
🔧 Creating password reset tables...
✅ Created password_reset_tokens table
✅ Created index on email
✅ Created index on token
✅ Created index on expires_at
✅ Created password_reset_attempts table
✅ Created index on email and attempted_at

🎉 All password reset tables created successfully!
```

---

## Step 2: Restart Your Server

Stop your current server (Ctrl+C) and restart:

```bash
npm run dev
```

---

## Step 3: Test Forgot Password

### From Admin Dashboard:
1. Login as admin
2. Click profile menu (top right)
3. Click "Change/Forgot Password"
4. Click "Forgot Password" tab
5. Enter your email
6. Click "Send OTP"
7. Check your email for OTP
8. Enter OTP and verify
9. Set new password

### From Therapist Dashboard:
1. Login as therapist
2. Click profile menu (top right)
3. Click "Change/Forgot Password"
4. Click "Forgot Password" tab
5. Follow same steps as above

---

## ⚠️ Important Notes

1. **Email Configuration Required**
   - Make sure `.env.local` has:
     ```
     GMAIL_USER=your-email@gmail.com
     GMAIL_APP_PASSWORD=your-app-password
     ```

2. **OTP Expiry**
   - OTP expires in 10 minutes
   - Request new OTP if expired

3. **Rate Limiting**
   - Max 3 OTP requests per hour per email
   - Wait 1 hour if limit exceeded

4. **Password Requirements**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number

---

## 🐛 Troubleshooting

### "Failed to send OTP email"
- Check Gmail credentials in `.env.local`
- Check internet connection
- Check Gmail app password is correct

### "Too many requests"
- Wait 1 hour before trying again
- Or manually clear `password_reset_attempts` table

### "OTP has expired"
- Request a new OTP
- OTP is valid for 10 minutes only

### "Invalid OTP"
- Check email for correct OTP
- Make sure you're using the latest OTP
- OTP is case-sensitive (all numbers)

---

## ✅ What's Working

- ✅ Admin Dashboard forgot password
- ✅ Therapist Dashboard forgot password
- ✅ Email sending with OTP
- ✅ OTP verification
- ✅ Password reset
- ✅ Rate limiting
- ✅ Security features

## ⚠️ What's Pending

- ⚠️ Login page "Forgot Password" link (not connected yet)
- ⚠️ Client Dashboard (no password functionality)

---

**Ready to test!** 🎉
