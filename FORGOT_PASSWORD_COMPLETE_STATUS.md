# Forgot Password - Complete Status & Implementation Plan

## 📍 All Locations Where Forgot Password Exists

### 1. **LoginForm Component** ❌ NOT FUNCTIONAL
**File:** `components/LoginForm.tsx`
**Line:** 165-169
**Status:** Link exists but does nothing

```typescript
<a 
  href="#" 
  className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
>
  Forgot Your Password?
</a>
```

**Issue:** `href="#"` - no functionality attached
**What's Needed:** 
- Add state for modal: `const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);`
- Change to button: `<button type="button" onClick={() => setShowForgotPasswordModal(true)}>`
- Add modal component at bottom of LoginForm

---

### 2. **ChangePassword Component** ⚠️ PARTIALLY IMPLEMENTED (DEV ONLY)
**File:** `components/ChangePassword.tsx`
**Status:** UI exists but disabled in production, API calls are TODO

#### Features Present:
✅ Tab interface: "Change Password" | "Forgot Password"
✅ Three-step flow: Email → OTP → New Password
✅ Form validation and password strength checks
✅ Loading states and error handling
✅ Password visibility toggles

#### Issues:
❌ Only visible in development mode (Line 189, 229-231)
❌ API calls are simulated with TODO comments:
  - Line 115: `// TODO: Implement send OTP API`
  - Line 133: `// TODO: Implement verify OTP API`
  - Line 161: `// TODO: Implement reset password API`
❌ No actual backend integration

**Used In:**
- Admin Dashboard (Line 493 in `Dashboard.tsx`)
- Therapist Dashboard (Line 2605 in `TherapistDashboard.tsx`)

**What's Needed:**
- Replace TODO comments with actual API calls
- Enable in production mode
- Connect to backend endpoints

---

### 3. **Admin Dashboard** ✅ UI EXISTS (but not functional)
**File:** `components/Dashboard.tsx`
**Line:** 453-455
**Status:** Menu option exists, opens ChangePassword component

```typescript
<span className="text-sm font-medium">
  {import.meta.env.MODE === 'development' ? 'Change/Forgot Password' : 'Change Password'}
</span>
```

**Navigation:** Profile Menu → "Change/Forgot Password" → Opens ChangePassword component
**Issue:** ChangePassword component has non-functional forgot password tab

---

### 4. **Therapist Dashboard** ✅ UI EXISTS (but not functional)
**File:** `components/TherapistDashboard.tsx`
**Line:** 1795-1797
**Status:** Menu option exists, opens ChangePassword component

```typescript
<span className="text-sm font-medium">
  {import.meta.env.MODE === 'development' ? 'Change/Forgot Password' : 'Change Password'}
</span>
```

**Navigation:** Profile Menu → "Change/Forgot Password" → Opens ChangePassword component
**Issue:** ChangePassword component has non-functional forgot password tab

---

### 5. **AdminEditProfile Component** ❌ NO FORGOT PASSWORD
**File:** `components/AdminEditProfile.tsx`
**Status:** Only has profile editing, no password functionality

---

### 6. **EditProfile Component (Therapist)** ❌ NO FORGOT PASSWORD
**File:** `components/EditProfile.tsx`
**Status:** Only has profile editing, no password functionality

---

### 7. **ClientDashboard** ❌ NO FORGOT PASSWORD
**File:** `components/ClientDashboard.tsx`
**Status:** No password change or forgot password functionality at all

---

## 🔧 Backend Status

### Existing Endpoints:
✅ `/api/verify-password` - Verifies current password (Line 73 in `server/index.ts`)
✅ `/api/update-password` - Updates password (Line 386 in `server/index.ts`)
✅ `/api/change-password` - Changes password (Line 97 in `server/index.ts`)
✅ `/api/send-therapist-otp` - Sends OTP for therapist onboarding
✅ `/api/verify-therapist-otp` - Verifies OTP for therapist onboarding

### Missing Endpoints:
❌ `/api/forgot-password/send-otp` - Send OTP for password reset
❌ `/api/forgot-password/verify-otp` - Verify OTP for password reset
❌ `/api/forgot-password/reset` - Reset password with verified OTP

### Email Service:
✅ `lib/email.ts` - Has `sendOTPEmail()` function
✅ Uses Gmail SMTP with nodemailer
✅ Proper email templates exist
⚠️ Currently only used for therapist onboarding

---

## 📊 Summary Table

| Location | Component | Status | Functionality | Priority |
|----------|-----------|--------|---------------|----------|
| Login Screen | LoginForm.tsx | ❌ Not Functional | Link exists, does nothing | HIGH |
| Admin Dashboard | Dashboard.tsx → ChangePassword.tsx | ⚠️ Dev Only | UI exists, no backend | HIGH |
| Therapist Dashboard | TherapistDashboard.tsx → ChangePassword.tsx | ⚠️ Dev Only | UI exists, no backend | HIGH |
| Client Dashboard | ClientDashboard.tsx | ❌ Missing | No functionality at all | MEDIUM |
| Admin Profile | AdminEditProfile.tsx | ❌ Missing | No password functionality | LOW |
| Therapist Profile | EditProfile.tsx | ❌ Missing | No password functionality | LOW |

---

## 🎯 Implementation Plan

### Phase 1: Database Setup (5 minutes)

#### Create Password Reset Tokens Table
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

#### Create Rate Limiting Table
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

### Phase 2: Backend API (30 minutes)

#### Endpoint 1: Send OTP
```typescript
app.post('/api/forgot-password/send-otp', async (req, res) => {
  // 1. Validate email
  // 2. Check if user exists
  // 3. Check rate limiting (max 3 per hour)
  // 4. Generate 6-digit OTP
  // 5. Generate secure token
  // 6. Store in password_reset_tokens table
  // 7. Send email using sendOTPEmail()
  // 8. Return success
});
```

#### Endpoint 2: Verify OTP
```typescript
app.post('/api/forgot-password/verify-otp', async (req, res) => {
  // 1. Validate email and OTP
  // 2. Check if OTP exists and not expired
  // 3. Check if OTP not already used
  // 4. Verify OTP matches
  // 5. Mark OTP as used
  // 6. Return reset token
});
```

#### Endpoint 3: Reset Password
```typescript
app.post('/api/forgot-password/reset', async (req, res) => {
  // 1. Validate reset token
  // 2. Check token not expired/used
  // 3. Validate password strength
  // 4. Hash new password
  // 5. Update user password
  // 6. Mark token as used
  // 7. Send confirmation email
  // 8. Return success
});
```

---

### Phase 3: Frontend Updates (45 minutes)

#### 1. Update LoginForm Component
**File:** `components/LoginForm.tsx`

**Option A: Open Modal (Recommended)**
```typescript
const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

// Update link (Line 165-169)
<button
  type="button"
  onClick={() => setShowForgotPasswordModal(true)}
  className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
>
  Forgot Your Password?
</button>

// Add modal component
{showForgotPasswordModal && (
  <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
)}
```

**Option B: Redirect to ChangePassword**
```typescript
// Add prop to LoginForm
interface LoginFormProps {
  onLogin: (user: any) => void;
  onForgotPassword?: () => void; // NEW
}

// Update link
<button
  type="button"
  onClick={onForgotPassword}
  className="text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
>
  Forgot Your Password?
</button>
```

#### 2. Update ChangePassword Component
**File:** `components/ChangePassword.tsx`

**Changes:**
1. Remove development mode check (Line 189, 229-231)
2. Replace TODO at Line 115 with actual API call:
```typescript
const response = await fetch('/api/forgot-password/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: resetEmail })
});
const data = await response.json();
if (data.success) {
  setToast({ message: 'OTP sent to your email!', type: 'success' });
  setResetStep('otp');
} else {
  setPasswordError(data.error || 'Failed to send OTP');
}
```

3. Replace TODO at Line 133 with actual API call:
```typescript
const response = await fetch('/api/forgot-password/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: resetEmail, otp: resetOtp })
});
const data = await response.json();
if (data.success) {
  setToast({ message: 'OTP verified!', type: 'success' });
  setResetStep('password');
} else {
  setPasswordError(data.error || 'Invalid OTP');
}
```

4. Replace TODO at Line 161 with actual API call:
```typescript
const response = await fetch('/api/forgot-password/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: resetEmail,
    otp: resetOtp,
    newPassword: resetNewPassword 
  })
});
const data = await response.json();
if (data.success) {
  setToast({ message: 'Password reset successfully!', type: 'success' });
  // Reset form and switch to change password tab
  setResetEmail('');
  setResetOtp('');
  setResetNewPassword('');
  setResetConfirmPassword('');
  setResetStep('email');
  setActiveTab('change');
} else {
  setPasswordError(data.error || 'Failed to reset password');
}
```

#### 3. Create ForgotPasswordModal Component (Optional)

**New File:** `components/ForgotPasswordModal.tsx`

**Features:**
- Modal overlay with close button
- Same three-step flow as ChangePassword
- Reusable across application
- Can be used in LoginForm, Client Dashboard, etc.

---

### Phase 4: Email Templates (15 minutes)

#### Update sendOTPEmail Function
**File:** `lib/email.ts`

Add new function for password reset:
```typescript
export async function sendPasswordResetOTP(
  email: string,
  userName: string,
  otp: string,
  expiresAt: Date
): Promise<void> {
  // Similar to sendOTPEmail but with password reset messaging
}
```

---

## 📋 Implementation Checklist

### Database
- [ ] Create `password_reset_tokens` table
- [ ] Create `password_reset_attempts` table
- [ ] Add indexes
- [ ] Test table creation

### Backend
- [ ] Implement `/api/forgot-password/send-otp`
- [ ] Implement `/api/forgot-password/verify-otp`
- [ ] Implement `/api/forgot-password/reset`
- [ ] Add rate limiting logic
- [ ] Add OTP expiry validation (10 minutes)
- [ ] Add password strength validation
- [ ] Test all endpoints with Postman/Thunder Client

### Frontend - ChangePassword Component
- [ ] Remove development mode checks (Lines 189, 229-231)
- [ ] Replace TODO at Line 115 (send OTP)
- [ ] Replace TODO at Line 133 (verify OTP)
- [ ] Replace TODO at Line 161 (reset password)
- [ ] Add proper error handling
- [ ] Test all three steps

### Frontend - LoginForm Component
- [ ] Add forgot password modal state
- [ ] Change link to button with onClick
- [ ] Add ForgotPasswordModal component (optional)
- [ ] Test modal open/close

### Email
- [ ] Create password reset email template
- [ ] Test email sending
- [ ] Add success confirmation email

### Testing
- [ ] Test forgot password from login screen
- [ ] Test forgot password from admin dashboard
- [ ] Test forgot password from therapist dashboard
- [ ] Test OTP expiry (10 minutes)
- [ ] Test rate limiting (3 requests per hour)
- [ ] Test invalid OTP
- [ ] Test password strength validation
- [ ] Test email delivery

---

## 🚀 Recommended Implementation Order

1. **Database Setup** (5 min)
   - Create tables
   - Add indexes

2. **Backend API** (30 min)
   - Implement send-otp endpoint
   - Implement verify-otp endpoint
   - Implement reset endpoint
   - Add rate limiting

3. **Update ChangePassword Component** (20 min)
   - Remove dev mode checks
   - Replace TODO comments with API calls
   - Test functionality

4. **Update LoginForm** (10 min)
   - Add modal state
   - Change link to button
   - Test modal

5. **Email Templates** (10 min)
   - Create password reset template
   - Test email sending

6. **Testing** (30 min)
   - Test all flows
   - Fix bugs
   - Verify security

**Total Time: ~2 hours**

---

## 🔒 Security Considerations

1. **Rate Limiting**
   - Max 3 OTP requests per hour per email
   - Max 5 OTP requests per hour per IP
   - Track in `password_reset_attempts` table

2. **OTP Security**
   - 6-digit numeric OTP
   - 10-minute expiry
   - Single-use only
   - Cryptographically secure random generation

3. **Password Requirements**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number

4. **Token Security**
   - Unique token per reset request
   - Expire after use
   - Expire after 10 minutes

---

## 📝 Notes

- ChangePassword component is well-designed and just needs backend integration
- LoginForm needs minimal changes (just add modal trigger)
- Client Dashboard has no password functionality at all (future enhancement)
- Email service is already set up and working
- Database schema is straightforward
- Security measures are standard industry practices

---

**Status:** Ready for implementation
**Priority:** HIGH (security feature)
**Estimated Effort:** 2 hours
**Dependencies:** Email service (already exists), Database access

