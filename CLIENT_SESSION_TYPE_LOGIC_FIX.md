# Client Session Type Logic Fix

## Problem
Clients with paid therapy sessions were showing "Pre-therapy Notes" tab instead of full tabs because the logic was checking if `client_case_history` table had entries (which depends on therapist filling Paperform).

## Root Cause
Old logic checked:
- `client_case_history` table → hasPaidSessions
- `free_consultation_pretherapy_notes` table → hasFreeConsultation

This failed when:
- Therapist hasn't filled Paperform yet
- Session completed but forms pending
- N8N automation hasn't run

## New Logic (Booking-Based)

Now checks ONLY the `bookings` table:

```typescript
// Check for PAID session bookings (non-free-consultation)
hasPaidSessions = COUNT(bookings WHERE NOT ILIKE '%free consultation%') > 0

// Check for FREE consultation bookings
hasFreeConsultation = COUNT(bookings WHERE ILIKE '%free consultation%') > 0
```

## UI Display Rules

### Scenario 1: Client has ONLY free consultation booking
```
hasPaidSessions: false
hasFreeConsultation: true
→ Show: Overview + Pre-therapy Notes (2 tabs)
```

### Scenario 2: Client has paid session booking(s)
```
hasPaidSessions: true
hasFreeConsultation: false/true (doesn't matter)
→ Show: Overview + Case History + Progress Notes + Goal Tracking (4 tabs)
```

### Scenario 3: Client has BOTH
```
hasPaidSessions: true
hasFreeConsultation: true
→ Show: Overview + Case History + Progress Notes + Goal Tracking (4 tabs)
→ Free consultation note appears in Progress Notes list
```

## Test Results

### Test 1: Shaury Khant (Paid Sessions Only)
- Bookings: 4 paid therapy sessions
- Case History: Empty (therapist hasn't filled form)
- **Old Logic**: ❌ Showed Pre-therapy Notes (WRONG)
- **New Logic**: ✅ Shows all 4 tabs (CORRECT)

### Test 2: Nilofer Khan (Free Consultation Only)
- Bookings: 1 free consultation
- Case History: Empty
- **Old Logic**: ✅ Showed Pre-therapy Notes (CORRECT)
- **New Logic**: ✅ Shows Pre-therapy Notes (CORRECT)

## Benefits

1. ✅ **Immediate UI update** - Tabs show correctly as soon as booking is made
2. ✅ **No dependency on Paperform** - UI doesn't wait for therapist to fill forms
3. ✅ **Accurate representation** - Based on actual bookings, not form submissions
4. ✅ **Handles all scenarios** - Works for new clients, existing clients, mixed bookings

## Files Modified

### Backend
- `server/index.ts` (line 2899-2930)
  - Removed `client_case_history` table check
  - Removed `free_consultation_pretherapy_notes` table check
  - Added paid bookings check (NOT ILIKE '%free consultation%')
  - Kept free consultation bookings check (ILIKE '%free consultation%')

### Frontend
- No changes needed (uses same API response)

## API Endpoint

**GET** `/api/client-session-type?client_id={phone}`

**Response:**
```json
{
  "success": true,
  "data": {
    "hasPaidSessions": boolean,
    "hasFreeConsultation": boolean
  }
}
```

## Testing Checklist
- [x] Shaury Khant - Shows 4 tabs (has paid sessions)
- [x] Nilofer Khan - Shows 2 tabs (has only free consultation)
- [ ] Test new client booking paid session directly
- [ ] Test client with free consultation who then books paid session
- [ ] Verify tabs update correctly after new booking
- [ ] Check both TherapistDashboard and AllTherapists views

## Notes
- The UI will now show correct tabs immediately after booking
- Case history/progress notes will be empty until therapist fills Paperform
- This is expected behavior - tabs show structure, content fills in later
- Free consultation notes still work the same way (show in Pre-therapy Notes tab)
