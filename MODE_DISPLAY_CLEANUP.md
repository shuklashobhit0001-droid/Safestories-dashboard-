# Mode Display Cleanup - "In-person" Text

## Issue
Mode was displaying as "In-person (SafeStories Office - Lullanagar, Pune, Maharashtra 411040)" with full location details.

## Requirement
Display only "In-person" without the location details.

## Root Cause
The database column `booking_mode` stores the full text including location details. The frontend needs to clean this up for display.

## Solution Applied

### 1. Fixed Database Column Reference
- Changed `mode` to `booking_mode as mode` in API queries
- Files updated:
  - `api/index.ts` - therapist-details endpoint
  - `server/index.ts` - therapist-details endpoint

### 2. Updated Mode Formatting Functions
Added logic to clean up "In-person" text by removing location details:

#### AllClients.tsx
- `formatMode()` function already handles this correctly
- Checks if mode includes "person", "office", or "clinic"
- Returns just "In-Person"

#### TherapistDashboard.tsx  
- `formatMode()` function already handles this correctly
- Same logic as AllClients.tsx
- Also updated inline mode displays in bookings tables (lines 1617 and 2899)

#### AllTherapists.tsx
- Updated inline mode display (line 1739)
- Added logic to clean up "In-person (location)" to just "In-person"

#### Appointments.tsx
- Added new `formatMode()` function
- Updated mode display to use `formatMode(apt.booking_mode)`

## Files Modified
1. `api/index.ts` - Fixed column name from `mode` to `booking_mode as mode`
2. `server/index.ts` - Fixed column name from `mode` to `booking_mode as mode`
3. `components/AllTherapists.tsx` - Added cleanup logic for inline mode display
4. `components/TherapistDashboard.tsx` - Added cleanup logic for inline mode displays (2 locations)
5. `components/Appointments.tsx` - Added formatMode function and applied it

## Result
All mode displays now show:
- "In-person" (clean, without location details)
- "Google Meet" (for online sessions)
- Original value for other modes

## Testing
The formatMode functions check for:
- "person" in mode string → returns "In-person"
- "office" in mode string → returns "In-person"  
- "clinic" in mode string → returns "In-person"
- "google" or "meet" in mode string → returns "Google Meet"

This ensures consistent display across all components.
