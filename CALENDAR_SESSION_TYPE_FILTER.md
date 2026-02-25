# Calendar Session Type Filter Implementation

## Summary
Added Session Type filter to both Admin and Therapist Calendars with Free Consultation option.

## Changes Made

### 1. TherapistDashboard.tsx (Therapist Calendar)

#### Added State:
```typescript
const [calendarSessionTypeFilter, setCalendarSessionTypeFilter] = useState<'all' | 'individual' | 'couples' | 'free_consultation'>('all');
```

#### Added Filter UI:
New filter row between "Session Mode" and "Status" filters with 4 options:
- All Types
- Individual Therapy
- Couples Therapy
- Free Consultation

#### Updated TherapistCalendar Props:
Added `sessionTypeFilter={calendarSessionTypeFilter}` prop

### 2. AllTherapists.tsx (Admin Calendar)

#### Added State:
```typescript
const [selectedSessionTypeFilter, setSelectedSessionTypeFilter] = useState<'all' | 'individual' | 'couples' | 'free_consultation'>('all');
```

#### Added Filter UI:
New filter row between "Session Mode" and "Therapists" filters with 4 options:
- All Types
- Individual
- Couples
- Free Consultation

#### Updated TherapistCalendar Props:
Added `sessionTypeFilter={selectedSessionTypeFilter}` prop

### 3. TherapistCalendar.tsx

#### Updated Interface:
```typescript
interface TherapistCalendarProps {
  // ... existing props
  sessionTypeFilter?: 'all' | 'individual' | 'couples' | 'free_consultation';
}
```

#### Added Filter Logic:
In `convertAppointmentsToEvents()` function, added session type filtering:
```typescript
// Apply session type filter
const sessionType = apt.session_name || apt.booking_resource_name || apt.therapy_type || 'Session';
const sessionTypeLower = sessionType.toLowerCase();

if (sessionTypeFilter !== 'all') {
  if (sessionTypeFilter === 'individual' && !sessionTypeLower.includes('individual')) return;
  if (sessionTypeFilter === 'couples' && !sessionTypeLower.includes('couples')) return;
  if (sessionTypeFilter === 'free_consultation' && !sessionTypeLower.includes('free consultation')) return;
}
```

#### Updated Dependencies:
Added `sessionTypeFilter` to useEffect dependency array

## Filter Options

### Session Type Filter:
1. **All Types** - Shows all sessions (default)
2. **Individual Therapy** - Shows only Individual Therapy sessions
3. **Couples Therapy** - Shows only Couples Therapy sessions
4. **Free Consultation** - Shows only Free Consultation sessions

## How It Works

1. User selects a session type filter button
2. State updates in TherapistDashboard or AllTherapists
3. Filter is passed to TherapistCalendar component
4. Calendar filters appointments based on session type
5. Only matching sessions are displayed on the calendar

## Matching Logic

The filter checks if the session name/type contains the filter keyword:
- `individual` → matches "Individual Therapy Session"
- `couples` → matches "Couples Therapy Session"
- `free consultation` → matches "Free Consultation - SafeStories"

## UI Design

- Consistent styling with existing Mode and Status filters
- Teal background for selected filter
- White background with gray border for unselected
- Hover effect on unselected filters
- **Admin Dashboard**: Positioned between Mode and Therapists filters
- **Therapist Dashboard**: Positioned between Mode and Status filters

## Locations

### Admin Dashboard:
- Navigate to "All Therapists"
- Click "Calendar View" button
- Session Type filter appears in the top right section

### Therapist Dashboard:
- Click "My Calendar" button
- Session Type filter appears below Session Mode filter

## Files Modified
1. `components/TherapistDashboard.tsx`
2. `components/AllTherapists.tsx`
3. `components/TherapistCalendar.tsx`

## Status
✅ COMPLETE - Session Type filter with Free Consultation option added to both Admin and Therapist calendars
