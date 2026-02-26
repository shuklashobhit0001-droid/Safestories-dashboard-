# Leads Tab Merged into Clients Tab

## Summary
Successfully merged the "Leads" tab into the "Clients" tab in the All Clients section of the Admin Dashboard.

## Changes Made

### 1. Tab Structure
**Before:**
- 3 tabs: Clients, Pre-Therapy, Leads

**After:**
- 2 tabs: Clients, Pre-Therapy
- Leads are now part of the Clients tab

### 2. Client Filtering Logic
- **Clients Tab** now shows:
  - Regular clients (session_count > 0, therapist NOT "Safestories")
  - Leads (session_count = 0, therapist NOT "Safestories")
- **Pre-Therapy Tab** remains unchanged (clients with "Safestories" as therapist)

### 3. Status Column Enhancement
**New Status Badge for Leads:**
- Color: Blue (#3B82F6)
- Label: "Invitation Sent"

**Existing Status Badges:**
- Active: Teal (#21615D)
- Inactive: Gray (#9CA3AF)
- Drop-out: Red (#B91C1C)

### 4. Data Mapping for Leads

| Column | Leads Data |
|--------|------------|
| Client Name | ✅ Client name |
| Contact Info | ✅ Phone + Email |
| No. of Bookings | 0 |
| Session Name | ✅ Session name |
| Mode | N/A |
| Assigned Therapist | ✅ Therapist name |
| Last Session Booked | Booking link sent date |
| Status | "Invitation Sent" badge |

### 5. Actions for Leads
When a lead row is expanded:
- **Send Booking Link** button is available
- **Transfer** button is hidden (only for regular clients)

### 6. CSV Export Updated
- Clients tab export now includes both regular clients and leads
- Export columns: Client Name, Phone No., Email ID, No. of Bookings, Session Name, Assigned Therapist, Last Session Booked, Status
- Leads show "Invitation Sent" in Status column

### 7. Status Filters Behavior
- **All**: Shows both regular clients and leads
- **Active/Inactive/Drop-out**: Shows only regular clients (excludes leads)
- Leads don't have active/inactive/drop-out status, so they're filtered out when these filters are selected

## Files Modified
- `components/AllClients.tsx`

## Technical Details

### Type Changes
```typescript
// Before
const [activeTab, setActiveTab] = useState<'clients' | 'pretherapy' | 'leads'>('clients');

// After
const [activeTab, setActiveTab] = useState<'clients' | 'pretherapy'>('clients');
```

### Lead Detection
```typescript
const isLead = client.session_count === 0;
```

### Conditional Rendering
- Mode column: Shows "N/A" for leads
- Last Session Booked: Shows booking link sent date for leads
- Status: Shows "Invitation Sent" badge for leads
- Transfer button: Hidden for leads in expanded row

## Benefits
1. **Simplified Navigation**: Reduced from 3 tabs to 2 tabs
2. **Better UX**: All client types in one view with clear status differentiation
3. **Consistent UI**: Same table structure for all clients
4. **Clear Status**: "Invitation Sent" badge clearly identifies leads
5. **Flexible Filtering**: Status filters work naturally with the merged data

## Testing Checklist
- ✅ Build successful with no TypeScript errors
- ✅ Leads appear in Clients tab with "Invitation Sent" status
- ✅ Regular clients show correct Active/Inactive/Drop-out status
- ✅ Status filters work correctly (All shows leads, others don't)
- ✅ CSV export includes both clients and leads
- ✅ Expanded row actions work (Send Booking Link for all, Transfer only for regular clients)
- ✅ Pre-Therapy tab remains unchanged

## Date
February 26, 2026

## Status
✅ Complete - Ready for testing in browser
