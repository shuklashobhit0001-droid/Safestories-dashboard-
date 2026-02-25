# Therapist Details Table Implementation

## Overview
Created a new `therapist_details` table to store therapist profile information submitted through the onboarding modal. This separates the submission data from the main `therapists` table used for active therapists.

## Database Schema

### Table: `therapist_details`

```sql
CREATE TABLE therapist_details (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES new_therapist_requests(request_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  specializations TEXT NOT NULL,
  specialization_details JSONB,
  qualification VARCHAR(255),
  qualification_pdf_url TEXT,
  profile_picture_url TEXT,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_review',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Field Mapping (Form → Database)

| Form Field | Database Column | Type | Required | Notes |
|------------|----------------|------|----------|-------|
| Profile Picture | `profile_picture_url` | TEXT | No | S3/MinIO URL |
| Name | `name` | VARCHAR(255) | Yes | Full name |
| Email | `email` | VARCHAR(255) | Yes | Unique, for login |
| Phone Number | `phone` | VARCHAR(50) | Yes | With country code |
| Specializations | `specializations` | TEXT | Yes | Comma-separated |
| Price & Description | `specialization_details` | JSONB | No | Array of objects |
| Qualification | `qualification` | VARCHAR(255) | No | Text description |
| Qualification PDF | `qualification_pdf_url` | TEXT | No | S3/MinIO URL |
| Password | `password` | VARCHAR(255) | Yes | For login |

### Status Values
- `pending_review` - Default, waiting for admin approval
- `approved` - Admin approved, ready to create therapist account
- `rejected` - Admin rejected the application

## Data Flow

### 1. Admin Creates Request
```
Admin Dashboard → Add New Therapist
↓
Stores in: new_therapist_requests
Fields: therapist_name, email, whatsapp_number, specializations, specialization_details
Status: 'pending'
↓
Sends OTP email to therapist
```

### 2. Therapist Logs In with OTP
```
Login Page → First Time Login (OTP)
↓
Verifies OTP from: new_therapist_requests
↓
Creates temporary user object with needsProfileCompletion: true
↓
Redirects to Therapist Dashboard
```

### 3. Therapist Completes Profile
```
Dashboard → CompleteProfileModal (auto-opens)
↓
Form pre-filled from: new_therapist_requests
↓
Therapist fills additional details:
  - Profile picture (upload)
  - Qualification text
  - Qualification PDF (upload)
  - Password (create)
↓
Submits to: /api/complete-therapist-profile
↓
Stores in: therapist_details
Status: 'pending_review'
↓
Updates: new_therapist_requests.status = 'profile_submitted'
```

### 4. Admin Reviews (Future Feature)
```
Admin Dashboard → Pending Therapist Profiles
↓
Reviews: therapist_details (status = 'pending_review')
↓
Approves/Rejects
↓
If Approved:
  - Create entry in: therapists table
  - Create entry in: users table (for login)
  - Update: therapist_details.status = 'approved'
  - Send approval email
```

## API Endpoints

### POST `/api/complete-therapist-profile`
Stores therapist profile data in `therapist_details` table.

**Request Body:**
```json
{
  "requestId": 21,
  "name": "Shobhit",
  "email": "shobhit@fluid.live",
  "phone": "+916362474363",
  "specializations": "Individual Therapy, Couples Therapy",
  "specializationDetails": [
    { "name": "Individual Therapy", "price": "1500", "description": "..." },
    { "name": "Couples Therapy", "price": "2000", "description": "..." }
  ],
  "qualification": "M.A. Clinical Psychology",
  "qualificationPdfUrl": "https://...",
  "profilePictureUrl": "https://...",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile submitted successfully! Your profile will be reviewed by admin within 5-10 days.",
  "detailsId": 1
}
```

## UI Changes

### CompleteProfileModal
- **Profile Picture**: Moved to top with circular preview (like admin dashboard)
- **Layout**: Centered profile picture with upload button overlay
- **Auto-fill**: Name, email, phone, specializations from `new_therapist_requests`
- **Success Message**: Shows 5-10 day review notice

## Files Modified

1. **scripts/createTherapistDetailsTable.ts** - Table creation script
2. **scripts/checkTherapistDetailsTable.ts** - Verification script
3. **server/index.ts** - Updated `/api/complete-therapist-profile` endpoint
4. **components/CompleteProfileModal.tsx** - Moved profile picture to top

## Testing

### Run Table Creation
```bash
npx tsx scripts/createTherapistDetailsTable.ts
```

### Verify Table Structure
```bash
npx tsx scripts/checkTherapistDetailsTable.ts
```

### Test Flow
1. Admin adds new therapist request
2. Therapist receives OTP email
3. Therapist logs in with OTP
4. Modal opens with pre-filled data
5. Therapist uploads profile picture (shows at top)
6. Therapist fills remaining fields
7. Submits → Data stored in `therapist_details`
8. Success message shows review timeline

## Next Steps (Future)

1. **Admin Review UI**: Create interface for admins to review pending profiles
2. **Approval Flow**: When admin approves, create entries in `therapists` and `users` tables
3. **Email Notifications**: Send approval/rejection emails
4. **File Upload**: Integrate S3/MinIO for profile pictures and PDFs
5. **Password Hashing**: Add bcrypt for secure password storage

## Status
✅ Table created
✅ API endpoint updated
✅ UI updated (profile picture at top)
✅ Data flow implemented
⏳ Admin review UI (pending)
⏳ File upload integration (pending)
