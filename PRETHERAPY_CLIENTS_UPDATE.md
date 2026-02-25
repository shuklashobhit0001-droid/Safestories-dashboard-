# Pre-Therapy Clients Tab Updates

## Changes Made

### 1. All Clients Component Updates

#### Column Changes:
- **Pre-Therapy Tab:**
  - ✅ Removed "No. of Bookings" column
  - ✅ Added "Pre-therapy Date" column (shows latest booking date)
  - ✅ Removed "Assigned Therapist" column
  - ✅ Updated Actions column with "Assign a Therapist" button only

- **Leads Tab:**
  - ✅ Removed "No. of Bookings" column
  - ✅ Kept "Assigned Therapist" and "Booking Link Sent" columns

- **Clients Tab:**
  - ✅ No changes (kept as is)

#### Actions Button Changes:
- **Clients Tab:** Shows "Send Booking Link" and "Transfer" buttons
- **Pre-Therapy Tab:** Shows only "Assign a Therapist" button
- **Leads Tab:** No actions column

### 2. API Updates (api/index.ts & server/index.ts)

#### Fixed N/A Issue for Pre-therapy Dates:
- Updated `latest_booking_date` logic to include ALL bookings for Safestories (pre-therapy) clients
- Previously: Only active bookings (excluding cancelled/no_show) were counted
- Now: For Safestories clients, ALL bookings are included regardless of status
- For regular clients: Still only counts active bookings

**Code Change:**
```typescript
// Before
const isActiveBooking = row.booking_status && !['cancelled', 'canceled', 'no_show', 'no show'].includes(row.booking_status);
if (isActiveBooking || !row.booking_status) {
  // Update latest_booking_date
}

// After
const isSafestories = row.booking_host_name && row.booking_host_name.toLowerCase().trim() === 'safestories';
const isActiveBooking = row.booking_status && !['cancelled', 'canceled', 'no_show', 'no show'].includes(row.booking_status);

// For Safestories (pre-therapy), include all bookings; for others, only active bookings
if (isSafestories || isActiveBooking || !row.booking_status) {
  // Update latest_booking_date
}
```

### 3. SendBookingModal Updates

#### New Props:
```typescript
interface SendBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledClient?: {
    name: string;
    phone: string;
    email: string;
  };
}
```

#### Auto-fill Behavior:
- When opened from "Assign a Therapist" button in Pre-Therapy tab:
  - ✅ Client Name: Auto-filled (read-only via existing client)
  - ✅ WhatsApp No.: Auto-filled with country code parsing
  - ✅ Email: Auto-filled
  - ⚠️ Therapy Type: Manual selection required
  - ⚠️ Therapist: Manual selection required

### 4. CSV Export Updates

Updated CSV export to match new column structure:
- **Pre-Therapy:** Client Name, Phone No., Email ID, Pre-therapy Date
- **Leads:** Client Name, Phone No., Email ID, Assigned Therapist, Booking Link Sent
- **Clients:** Client Name, Phone No., Email ID, No. of Bookings, Assigned Therapist

## Files Modified

1. `components/AllClients.tsx`
   - Added `prefilledClientData` state
   - Added `handleAssignTherapist` function
   - Updated table headers and columns
   - Updated actions buttons per tab
   - Updated CSV export logic

2. `components/SendBookingModal.tsx`
   - Added `prefilledClient` prop
   - Added useEffect to populate form with prefilled data
   - Auto-parses phone number to extract country code

3. `api/index.ts`
   - Updated `/api/clients` endpoint to include all bookings for Safestories clients

4. `server/index.ts`
   - Updated `/api/clients` endpoint (same fix as api/index.ts)

## Testing Checklist

- [ ] Pre-Therapy tab shows correct columns (Name, Contact, Pre-therapy Date, Actions)
- [ ] Pre-therapy Date shows actual dates (not N/A) for Sonia and Ketki
- [ ] "Assign a Therapist" button opens modal with pre-filled client data
- [ ] Therapy and Therapist dropdowns work correctly in modal
- [ ] Leads tab shows correct columns (no "No. of Bookings")
- [ ] Clients tab remains unchanged
- [ ] CSV export works for all three tabs with correct columns
- [ ] Expanded rows (multiple therapists) display correctly

## Deployment Notes

- Changes affect both frontend (AllClients, SendBookingModal) and backend (API endpoints)
- Need to deploy both api/index.ts and components to Vercel
- No database schema changes required
