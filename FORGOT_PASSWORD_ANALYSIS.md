# Forgot Password Feature Analysis

## Current Status

### ✅ What Exists (Partially Implemented)

#### 1. **Frontend UI - ChangePassword Component**
**Location:** `components/ChangePassword.tsx`

**Features:**
- ✅ Tab interface with "Change Password" and "Forgot Password" tabs
- ✅ Three-step flow: Email → OTP → New Password
- ✅ Form validation for password strength
- ✅ Password visibility toggles
- ✅ Loading states and error handling
- ⚠️ **Only visible in development mode** (`import.meta.env.MODE === 'development'`)
- ❌ **API calls are TODO/simulated**

**Flow:**
1. **Step 1 - Email**: User enters email → Send OTP
2. **Step 2 - OTP**: User enters OTP → Verify OTP
3. **Step 3 - Password**: User enters new password → Reset password

#### 2. **Frontend UI - LoginForm Component**
**Location:** `components/LoginForm.tsx`

**Features:**
- ✅ "Forgot Your Password?" link displayed
- ❌ **Link does nothing** (href="#")
- ❌ No modal or redirect to forgot password flow

#### 3. **Backend API - Partial**
**Location:** `server/index.ts`, `api/index.ts`

**Existing Endpoints:**
- ✅ `/api/send-therapist-otp` - Generates OTP for therapist login
- ✅ `/api/verify-therapist-otp` - Verifies OTP for therapist login
- ❌ **These are for LOGIN, not password reset**
- ❌ No dedicated forgot password endpoints

#### 4. **Email Service**
**Location:** `lib/email.ts`, `api/lib/email.ts`

**Features:**
- ✅ `sendOTPEmail()` function exists
- ✅ Uses Resend API for sending emails
- ✅ Proper email templates
- ⚠️ Currently only used for therapist onboarding

---

## ❌ What's Missing (Needs Implementation)

### 1. **Frontend - LoginForm Integration**
- ❌ Forgot password link doesn't work
- ❌ No modal/page for forgot password flow
- ❌ No way to access forgot password from login screen

### 2. **Frontend - ChangePassword Component**
- ❌ API calls are simulated (TODO comments)
- ❌ Feature disabled in production
- ❌ No actual backend integration
- ❌ No error handling for API failures

### 3. **Backend - API Endpoints**
Need to create:
- ❌ `POST /api/forgot-password/send-otp` - Send OTP to email
- ❌ `POST /api/forgot-password/verify-otp` - Verify OTP
- ❌ `POST /api/forgot-password/reset` - Reset password with OTP

### 4. **Database**
Need to add:
- ❌ Table/columns for password reset tokens
- ❌ OTP storage with expiry
- ❌ Rate limiting for OTP requests

### 5. **Security**
Missing:
- ❌ Rate limiting (prevent OTP spam)
- ❌ OTP expiry validation
- ❌ Account lockout after failed attempts
- ❌ Email verification before sending OTP
- ❌ Secure token generation
- ❌ Password history (prevent reuse)

### 6. **User Experience**
Missing:
- ❌ Resend OTP functionality
- ❌ OTP expiry countdown timer
- ❌ Clear error messages
- ❌ Success confirmation
- ❌ Redirect after password reset

---

## 🎯 Implementation Plan

### Phase 1: Database Setup

#### Create Password Reset Table
```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX idx_password_reset_email ON password_reset_tokens(email);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);
```

#### Add Rate Limiting Table
```sql
CREATE TABLE password_reset_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  attempted_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_reset_attempts_email ON password_reset_attempts(email, attempted_at);
```

---

### Phase 2: Backend API Implementation

#### Endpoint 1: Send OTP
```typescript
POST /api/forgot-password/send-otp

Request:
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": 600 // seconds
}

Errors:
- 404: Email not found
- 429: Too many requests
- 500: Server error
```

**Logic:**
1. Validate email format
2. Check if user exists
3. Check rate limiting (max 3 requests per hour)
4. Generate 6-digit OTP
5. Generate secure token
6. Store in database with 10-minute expiry
7. Send email with OTP
8. Return success

#### Endpoint 2: Verify OTP
```typescript
POST /api/forgot-password/verify-otp

Request:
{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "resetToken": "secure-token-here"
}

Errors:
- 400: Invalid OTP
- 410: OTP expired
- 404: No OTP found
- 500: Server error
```

**Logic:**
1. Validate email and OTP
2. Check if OTP exists and not expired
3. Check if OTP not already used
4. Verify OTP matches
5. Mark OTP as used
6. Return reset token for next step

#### Endpoint 3: Reset Password
```typescript
POST /api/forgot-password/reset

Request:
{
  "resetToken": "secure-token-here",
  "newPassword": "NewPassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}

Errors:
- 400: Invalid token or weak password
- 410: Token expired
- 500: Server error
```

**Logic:**
1. Validate reset token
2. Check token not expired
3. Check token not used
4. Validate password strength
5. Hash new password
6. Update user password
7. Mark token as used
8. Invalidate all other reset tokens for user
9. Send confirmation email
10. Return success

---

### Phase 3: Frontend Implementation

#### 1. Create ForgotPasswordModal Component
```typescript
components/ForgotPasswordModal.tsx

Features:
- Modal overlay
- Three-step wizard
- Email input with validation
- OTP input (6 digits)
- Password input with strength meter
- Resend OTP button
- Countdown timer
- Error handling
- Loading states
```

#### 2. Update LoginForm
```typescript
components/LoginForm.tsx

Changes:
- Add state for forgot password modal
- Make "Forgot Password" link functional
- Open modal on click
- Handle modal close
```

#### 3. Update ChangePassword Component
```typescript
components/ChangePassword.tsx

Changes:
- Replace TODO comments with actual API calls
- Add proper error handling
- Enable in production mode
- Add success redirect
- Add resend OTP functionality
```

---

### Phase 4: Security Enhancements

#### 1. Rate Limiting
```typescript
// Max 3 OTP requests per hour per email
// Max 5 OTP requests per hour per IP
// Max 10 failed OTP verifications per hour
```

#### 2. OTP Security
```typescript
// 6-digit numeric OTP
// 10-minute expiry
// Single use only
// Secure random generation
```

#### 3. Password Requirements
```typescript
// Minimum 8 characters
// At least 1 uppercase letter
// At least 1 lowercase letter
// At least 1 number
// At least 1 special character (optional)
// Not same as old password
```

#### 4. Logging & Monitoring
```typescript
// Log all password reset attempts
// Log successful resets
// Alert on suspicious activity
// Track IP addresses
```

---

### Phase 5: Email Templates

#### OTP Email Template
```html
Subject: Password Reset OTP - SafeStories

Hi [Name],

You requested to reset your password. Your OTP is:

[123456]

This OTP will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
SafeStories Team
```

#### Success Email Template
```html
Subject: Password Reset Successful - SafeStories

Hi [Name],

Your password has been successfully reset.

If you didn't make this change, please contact us immediately.

Best regards,
SafeStories Team
```

---

## 📋 Implementation Checklist

### Database
- [ ] Create `password_reset_tokens` table
- [ ] Create `password_reset_attempts` table
- [ ] Add indexes for performance
- [ ] Test database queries

### Backend API
- [ ] Implement `/api/forgot-password/send-otp`
- [ ] Implement `/api/forgot-password/verify-otp`
- [ ] Implement `/api/forgot-password/reset`
- [ ] Add rate limiting middleware
- [ ] Add input validation
- [ ] Add error handling
- [ ] Test all endpoints

### Frontend
- [ ] Create `ForgotPasswordModal` component
- [ ] Update `LoginForm` to open modal
- [ ] Update `ChangePassword` with real API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success messages
- [ ] Add resend OTP functionality
- [ ] Add countdown timer
- [ ] Test all flows

### Email
- [ ] Create OTP email template
- [ ] Create success email template
- [ ] Test email sending
- [ ] Handle email failures

### Security
- [ ] Implement rate limiting
- [ ] Add OTP expiry validation
- [ ] Add password strength validation
- [ ] Add logging
- [ ] Test security measures

### Testing
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test rate limiting
- [ ] Test OTP expiry
- [ ] Test invalid inputs
- [ ] Test email delivery

### Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Security documentation

---

## 🚀 Quick Start Implementation

### Step 1: Database (5 minutes)
```bash
# Run migration script
npm run db:migrate:forgot-password
```

### Step 2: Backend (30 minutes)
```bash
# Implement API endpoints in server/index.ts
# Add rate limiting
# Add validation
```

### Step 3: Frontend (45 minutes)
```bash
# Create ForgotPasswordModal component
# Update LoginForm
# Update ChangePassword
```

### Step 4: Testing (30 minutes)
```bash
# Test all flows
# Fix bugs
# Deploy
```

**Total Time: ~2 hours**

---

## 🔒 Security Considerations

1. **OTP Security**
   - Use cryptographically secure random generation
   - Single-use tokens
   - Short expiry (10 minutes)
   - Rate limiting

2. **Email Verification**
   - Verify email exists before sending OTP
   - Don't reveal if email exists (security)
   - Send confirmation after reset

3. **Password Security**
   - Enforce strong passwords
   - Hash with bcrypt
   - Don't allow password reuse
   - Invalidate old sessions

4. **Rate Limiting**
   - Per email: 3 requests/hour
   - Per IP: 5 requests/hour
   - Account lockout after 10 failed attempts

5. **Logging**
   - Log all attempts
   - Monitor for abuse
   - Alert on suspicious activity

---

## 📊 Current vs. Desired State

### Current State
- ❌ Forgot password link does nothing
- ❌ Feature disabled in production
- ❌ No backend implementation
- ❌ No database tables
- ❌ No security measures

### Desired State
- ✅ Functional forgot password flow
- ✅ Enabled in production
- ✅ Complete backend API
- ✅ Proper database structure
- ✅ Security measures in place
- ✅ Email notifications
- ✅ Rate limiting
- ✅ Comprehensive testing

---

**Status**: Ready for implementation
**Priority**: HIGH (security feature)
**Estimated Effort**: 2-3 hours
**Dependencies**: Email service (already exists)
