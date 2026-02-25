# 3-Status Logic Implementation

## Overview
Implemented a 3-status system (Active, Inactive, Drop-out) for client status tracking in:
- Therapist Dashboard - My Clients table
- Admin Dashboard - All Therapists - Assigned Clients table
- Admin Dashboard - All Clients - Clients tab

## Status Logic

### Active (Green Badge - #21615D)
- Client has at least one session in the last 30 days (excluding cancelled sessions)
- **Current Count**: 56 clients

### Inactive (Gray Badge - #9CA3AF)
- Client had MORE than 1 session in the past
- AND more than 30 days have passed since their last session
- **Current Count**: 1 client
  - Radhika Shourie (2 sessions, last one 35 days ago)

### Drop-out (Red Badge - #B91C1C)
- Client had ONLY 1 session
- AND more than 30 days have passed since that session
- **Current Count**: 5 clients
  - Sanjana (63 days ago) - Note: Different phone number, same email as active Sanjana
  - Anjali Hood (34 days ago)
  - Yukta Khanwani (38 days ago)
  - Shivani (48 days ago)
  - Varsha (62 days ago)

## Implementation Details

### Files Modified

1. **components/TherapistDashboard.tsx**
   - Updated `getClientStatus()` function to return `'active' | 'inactive' | 'drop-out'`
   - Filters client appointments excluding cancelled sessions
   - Counts total sessions to determine status
   - Updated status badge rendering with 3 colors

2. **components/AllTherapists.tsx**
   - Updated `getClientStatus()` function with same 3-status logic
   - Handles both single client view and table view
   - Handles multiple phone numbers (comma-separated)
   - Updated status badge rendering in:
     - Client detail header
     - Assigned clients table
     - Expanded rows for multiple phone numbers

3. **components/AllClients.tsx** (NEW)
   - Added `appointments` state to store all appointments data
   - Added `getClientStatus()` function with 3-status logic
   - Updated `useEffect` to fetch both clients and appointments
   - Added "Status" column header in Clients tab (after "Last Session Booked")
   - Added status badge rendering in Clients tab table body
   - Updated colspan from 8 to 9 for expanded rows
   - Status column ONLY in Clients tab, NOT in Leads or Pre-therapy tabs

### Badge Styling

```typescript
// Active
backgroundColor: '#21615D' // Green
text: 'Active'

// Inactive
backgroundColor: '#9CA3AF' // Gray
text: 'Inactive'

// Drop-out
backgroundColor: '#B91C1C' // Red
text: 'Drop-out'
```

### Status Calculation Logic

```typescript
const getClientStatus = (client: any): 'active' | 'inactive' | 'drop-out' => {
  // 1. Filter client appointments (excluding cancelled)
  const clientAppointments = appointments.filter(apt => {
    // Match by email or phone
    // Exclude cancelled sessions
  });
  
  // 2. Check for recent sessions (last 30 days)
  const hasRecentAppointment = clientAppointments.some(apt => {
    const aptDate = new Date(apt.booking_start_at);
    return aptDate >= thirtyDaysAgo;
  });
  
  // 3. Determine status
  if (hasRecentAppointment) {
    return 'active';
  }
  
  if (clientAppointments.length === 1) {
    return 'drop-out';
  }
  
  return 'inactive';
};
```

## Client Grouping by Email

The system groups clients by email first (when available), then falls back to phone number. This ensures that clients who use multiple phone numbers are treated as a single client record.

**Example: Sanjana**
- Email: sjoshi1597@gmail.com
- Phone 1: +49 15753251534 (German number) - 1 session, 63 days ago
- Phone 2: +91 9764328147 (Indian number) - 7 sessions, most recent 1 day ago
- When grouped by email: Shows as ONE client with ACTIVE status (considers all 8 sessions)

## Testing

Created test scripts to verify the implementation:
- `test_3_status_logic.ts` - Verifies status distribution across all clients
- `test_allclients_status.ts` - Tests the All Clients tab implementation
- `check_all_sanjana.ts` - Demonstrates email-based grouping

## Verification Results

✅ Total Clients: 62
✅ Active: 56 clients (90.3%)
✅ Inactive: 1 client (1.6%)
✅ Drop-out: 5 clients (8.1%)

## Components with Status Column

1. ✅ Therapist Dashboard - My Clients table
2. ✅ Admin Dashboard - All Therapists - Assigned Clients table
3. ✅ Admin Dashboard - All Clients - Clients tab
4. ❌ Admin Dashboard - All Clients - Leads tab (NOT added)
5. ❌ Admin Dashboard - All Clients - Pre-therapy tab (NOT added)
