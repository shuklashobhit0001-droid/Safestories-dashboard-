# Therapist Dashboard - My Clients Table Update

## Summary
Updated the My Clients table in Therapist Dashboard to remove contact info columns and add Session Name, Mode, and Status columns.

## Changes Made

### Backend Changes (api/index.ts & server/index.ts)

#### Updated `/api/therapist-clients` Endpoint

**Added to SQL Query:**
- `booking_resource_name` - Session/therapy type
- `booking_mode` - Session mode (Google Meet, In-person, etc.)
- `booking_status` - To filter active bookings

**Updated Grouping Logic:**
- Added `booking_resource_name`, `booking_mode`, `booking_status` to GROUP BY clause
- Track `recent_bookings` array for status calculation (last 30 days)
- Calculate `status` field: 'active' if client has bookings in last 30 days (excluding cancelled), 'inactive' otherwise

**Response Structure:**
```typescript
{
  clients: [
    {
      client_name: string,
      client_phone: string,
      client_email: string,
      total_sessions: number,
      booking_resource_name: string,
      booking_mode: string,
      status: 'active' | 'inactive'
    }
  ]
}
```

### Frontend Changes (components/TherapistDashboard.tsx)

#### 1. Added `formatMode()` Helper Function
```typescript
const formatMode = (mode: string | undefined): string => {
  if (!mode) return 'N/A';
  
  const modeLower = mode.toLowerCase();
  
  // Check for In-person variations
  if (modeLower.includes('person') || modeLower.includes('office') || modeLower.includes('clinic')) {
    return 'In-Person';
  }
  
  // Check for Google Meet variations
  if (modeLower.includes('google') || modeLower.includes('meet')) {
    return 'Google Meet';
  }
  
  // Default return the original value
  return mode;
};
```

#### 2. Updated Table Structure

**Old Columns:**
1. Client Name
2. Phone No.
3. Email ID
4. No. of Sessions

**New Columns:**
1. Client Name
2. Session Name
3. Mode (Google Meet / In-Person)
4. No. of Bookings (renamed from "No. of Sessions")
5. Status (Active/Inactive badge)

#### 3. Status Badge Styling
- Active: Green badge (`bg-green-100 text-green-800`)
- Inactive: Gray badge (`bg-gray-100 text-gray-800`)

#### 4. Updated Colspan
- Changed from 4 to 5 columns for loading/empty states

## Status Calculation Logic

**Active Status:**
- Client has at least one booking in the last 30 days
- Booking status is NOT 'cancelled' or 'canceled'

**Inactive Status:**
- No bookings in the last 30 days, OR
- All recent bookings are cancelled

This matches the logic used in Admin Dashboard → All Therapists → Assigned Clients.

## Display Logic

### Mode Column:
- "Google Meet" - for modes containing "google" or "meet"
- "In-Person" - for modes containing "person", "office", or "clinic"
- "N/A" - if no mode data available

### Session Name Column:
- Shows `booking_resource_name` from most recent booking
- Displays "N/A" if not available

### Status Column:
- Shows badge with "Active" or "Inactive"
- Color-coded for quick visual identification

## Files Modified

1. `api/index.ts` - Updated `/api/therapist-clients` endpoint
2. `server/index.ts` - Updated `/api/therapist-clients` endpoint
3. `components/TherapistDashboard.tsx` - Updated My Clients table UI

## Testing Checklist

- [ ] My Clients table shows 5 columns (Client Name, Session Name, Mode, No. of Bookings, Status)
- [ ] Phone and Email columns are removed
- [ ] Mode displays "Google Meet" or "In-Person" correctly
- [ ] Status badge shows "Active" (green) or "Inactive" (gray)
- [ ] Active status is based on bookings in last 30 days
- [ ] "No. of Sessions" is renamed to "No. of Bookings"
- [ ] Session Name shows the therapy type
- [ ] Clicking on a client still opens their detail view
- [ ] Search functionality still works
- [ ] Pagination still works correctly
- [ ] Build completes without errors

## Notes

- Removed contact information (phone/email) from the table for cleaner view
- Contact info is still available in the client detail view
- Status calculation uses the same 30-day logic as Admin Dashboard
- Mode formatting is consistent with All Clients section
