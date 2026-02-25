# Stats Cards Styling Audit

## Overview
This document lists all locations where stat cards are displayed in the application, along with their current styling for consistency review.

---

## 1. Admin Dashboard (Dashboard.tsx)
**Location:** Main dashboard view for admin users  
**Layout:** 4 columns (grid-cols-4)  
**Cards:** 8+ dynamic stats cards

### Styling:
```tsx
className="bg-white rounded-lg p-6 border"
```

### Card Structure:
- Background: `bg-white`
- Border: `border` (default gray)
- Padding: `p-6`
- Border radius: `rounded-lg`
- Hover effect: `hover:shadow-md transition-shadow` (for clickable cards)

### Text Styling:
- Title: `text-sm text-gray-600 mb-2`
- Value: `text-3xl font-bold` (black by default)

### Stats Displayed:
- Dynamic stats from API (Bookings, Sessions, Revenue, etc.)

---

## 2. Therapist Dashboard (TherapistDashboard.tsx)
**Location:** Main dashboard view for therapist users  
**Layout:** 
- Row 1: 4 columns (grid-cols-4)
- Row 2: 4 columns (grid-cols-4)

### Styling:
```tsx
className="bg-white rounded-lg p-6 border"
```

### Card Structure:
- Background: `bg-white`
- Border: `border` (default gray)
- Padding: `p-6`
- Border radius: `rounded-lg`
- Hover effect: `hover:shadow-md transition-shadow` (for clickable cards)

### Text Styling:
- Title: `text-sm text-gray-600 mb-2`
- Value: `text-3xl font-bold` with `color: #000000` inline style

### Stats Displayed:
**Row 1:**
1. Bookings (clickable)
2. Sessions Completed (clickable)
3. No-shows (clickable)
4. Cancelled (clickable)

**Row 2:**
5. Pending Session Notes (clickable)
6. Active Clients (clickable - redirects to My Clients with filter)
7. Inactive Clients (clickable - redirects to My Clients with filter)
8. Drop-Outs (clickable - redirects to My Clients with filter)

---

## 3. All Therapists - Therapist Detail View (AllTherapists.tsx)
**Location:** When viewing a specific therapist's details in admin dashboard  
**Layout:** 
- Row 1: 3 columns (grid-cols-3)
- Row 2: 4 columns (grid-cols-4)

### Styling:
```tsx
className="bg-gray-100 p-5 rounded-lg border border-gray-200"
```

### Card Structure:
- Background: `bg-gray-100` ⚠️ DIFFERENT
- Border: `border border-gray-200`
- Padding: `p-5` ⚠️ DIFFERENT (p-5 vs p-6)
- Border radius: `rounded-lg`
- NO hover effect (not clickable)

### Text Styling:
- Title: `text-sm text-gray-600 mb-1`
- Value: `text-3xl font-bold` with `color: #21615D` inline style ⚠️ DIFFERENT (teal color)

### Stats Displayed:
**Row 1:**
1. Total Sessions Lifetime
2. Total Revenue
3. Active Clients

**Row 2:**
4. Sessions This Month
5. Revenue This Month
6. Inactive Clients
7. Drop-Outs

---

## 4. Therapist Dashboard - Client Detail View (TherapistDashboard.tsx)
**Location:** When viewing a specific client's details in therapist dashboard  
**Layout:** 2 columns (grid-cols-2) for each row

### Styling:
```tsx
className="bg-white border rounded-lg p-4"
```

### Card Structure:
- Background: `bg-white`
- Border: `border` (default gray)
- Padding: `p-4` ⚠️ DIFFERENT (p-4 vs p-6)
- Border radius: `rounded-lg`
- NO hover effect (not clickable)

### Text Styling:
- Title: `text-sm text-gray-600 mb-1`
- Value: `text-3xl font-bold text-gray-900` or `text-lg font-bold text-gray-900`

### Stats Displayed:
**Row 1:**
1. Bookings
2. Sessions Completed

**Row 2:**
3. Next Session
4. Last Session

**Row 3:**
5. Cancellation
6. No-shows

---

## Summary of Inconsistencies

### Background Colors:
- ✅ Admin Dashboard: `bg-white`
- ✅ Therapist Dashboard: `bg-white`
- ⚠️ All Therapists Detail: `bg-gray-100` (DIFFERENT)
- ✅ Client Detail View: `bg-white`

### Padding:
- ✅ Admin Dashboard: `p-6`
- ✅ Therapist Dashboard: `p-6`
- ⚠️ All Therapists Detail: `p-5` (DIFFERENT)
- ⚠️ Client Detail View: `p-4` (DIFFERENT - smaller cards)

### Value Text Color:
- ✅ Admin Dashboard: Black (default)
- ✅ Therapist Dashboard: `#000000` (black)
- ⚠️ All Therapists Detail: `#21615D` (teal) (DIFFERENT)
- ✅ Client Detail View: `text-gray-900` (black)

### Border:
- ✅ Admin Dashboard: `border`
- ✅ Therapist Dashboard: `border`
- ⚠️ All Therapists Detail: `border border-gray-200` (explicit gray-200)
- ✅ Client Detail View: `border`

---

## Recommendations

### Option 1: Standardize All to White Background
Make all stat cards consistent with white background and p-6 padding:
- Change All Therapists Detail from `bg-gray-100 p-5` to `bg-white p-6`
- Keep Client Detail View at `p-4` (intentionally smaller for space constraints)

### Option 2: Keep Gray Background for Detail Views
Maintain visual hierarchy where detail views use gray background:
- Keep All Therapists Detail as `bg-gray-100`
- Consider changing Client Detail View to `bg-gray-100` for consistency

### Option 3: Standardize Value Colors
- Remove inline `color: #21615D` from All Therapists Detail
- Use consistent black/gray-900 across all views
- OR apply teal color to all stat values for brand consistency

---

## Color Codes Reference

### Current Colors Used:
- **Black:** `#000000` or `text-gray-900`
- **Teal (Brand):** `#21615D`
- **Gray Background:** `bg-gray-100`
- **White Background:** `bg-white`
- **Border Gray:** `border-gray-200`

### Status Badge Colors:
- **Active:** `#21615D` (teal/green)
- **Inactive:** `#9CA3AF` (gray)
- **Drop-out:** `#B91C1C` (red)
