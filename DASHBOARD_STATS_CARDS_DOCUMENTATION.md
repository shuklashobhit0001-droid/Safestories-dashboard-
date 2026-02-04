# Dashboard Stats Cards - Complete Documentation

## Overview
This document details all statistics cards displayed on the admin dashboard, including their data sources, SQL queries, and business logic.

---

## API Endpoint
**Route:** `GET /api/dashboard/stats`  
**File:** `/api/index.ts` (Lines 106-237)  
**Query Parameters:**
- `start` (optional): Start date for filtering (format: YYYY-MM-DD)
- `end` (optional): End date for filtering (format: YYYY-MM-DD)

---

## Stats Cards Breakdown

### 1. **Revenue Card**
**Display:** `₹{amount}`  
**Data Source:** `bookings` table  
**Column:** `invitee_payment_amount`

**Query Logic:**
```sql
SELECT COALESCE(SUM(invitee_payment_amount), 0) as total 
FROM bookings 
WHERE booking_status NOT IN ('cancelled', 'canceled')
  [AND booking_start_at BETWEEN {start} AND {end} 23:59:59]  -- if date filter applied
```

**Business Logic:**
- Sums all payment amounts from bookings
- **Excludes** cancelled/canceled bookings
- **Includes** confirmed, rescheduled, and no-show bookings
- Returns 0 if no data found

**Frontend Display:**
```typescript
{ title: 'Revenue', value: `₹${Number(statsData.revenue || 0).toLocaleString()}` }
```

---

### 2. **Refunded Card**
**Display:** `₹{amount}`  
**Data Source:** `bookings` table  
**Column:** `refund_amount`

**Query Logic:**
```sql
SELECT COALESCE(SUM(refund_amount), 0) as total 
FROM bookings 
WHERE refund_status IS NOT NULL
  [AND booking_start_at BETWEEN {start} AND {end} 23:59:59]  -- if date filter applied
```

**Business Logic:**
- Sums all refund amounts
- **Only includes** bookings where `refund_status` is NOT NULL
- Refund status can be: 'initiated', 'completed', 'processed', 'failed'
- Returns 0 if no refunds found

**Frontend Display:**
```typescript
{ title: 'Refunded', value: `₹${Number(statsData.refundedAmount || 0).toLocaleString()}` }
```

---

### 3. **Sessions Card**
**Display:** `{count}`  
**Data Source:** `bookings` table  
**Column:** `booking_status`

**Query Logic:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show')
  [AND booking_start_at BETWEEN {start} AND {end} 23:59:59]  -- if date filter applied
```

**Business Logic:**
- Counts all bookings
- **Excludes** cancelled, canceled, no_show, and "no show" (with space) statuses
- **Includes** confirmed and rescheduled bookings
- Represents actual sessions that happened or will happen

**Frontend Display:**
```typescript
{ title: 'Sessions', value: (statsData.sessions || 0).toString() }
```

---

### 4. **Free Consultations Card**
**Display:** `{count}`  
**Data Source:** `bookings` table  
**Columns:** `invitee_payment_amount`, `booking_subject`

**Query Logic:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE (invitee_payment_amount = 0 OR invitee_payment_amount IS NULL)
  [AND booking_start_at BETWEEN {start} AND {end} 23:59:59]  -- if date filter applied
```

**Business Logic:**
- Counts bookings with zero or null payment amount
- **Includes** all bookings where no payment was made
- Alternative identification: `booking_subject LIKE '%Free Consultation%'`
- Represents free consultation sessions

**Note:** The current query counts ALL zero-amount bookings. For accurate free consultation count, use:
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_subject LIKE '%Free Consultation%'
```

**Frontend Display:**
```typescript
{ title: 'Free Consultations', value: (statsData.freeConsultations || 0).toString() }
```

---

### 5. **Cancelled Card**
**Display:** `{count}`  
**Data Source:** `bookings` table  
**Column:** `booking_status`

**Query Logic:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_status IN ('cancelled', 'canceled')
  [AND booking_start_at BETWEEN {start} AND {end} 23:59:59]  -- if date filter applied
```

**Business Logic:**
- Counts bookings with cancelled or canceled status
- Handles both spelling variations (British vs American English)
- Represents sessions that were booked but later cancelled

**Frontend Display:**
```typescript
{ title: 'Cancelled', value: (statsData.cancelled || 0).toString() }
```

---

### 6. **Refunds Card**
**Display:** `{count}`  
**Data Source:** `bookings` table  
**Column:** `refund_status`

**Query Logic:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE refund_status IS NOT NULL
  [AND booking_start_at BETWEEN {start} AND {end} 23:59:59]  -- if date filter applied
```

**Business Logic:**
- Counts number of bookings that have a refund status
- **Includes** all refund statuses: initiated, completed, processed, failed
- Represents total number of refund transactions (not amount)

**Frontend Display:**
```typescript
{ title: 'Refunds', value: (statsData.refunds || 0).toString() }
```

---

### 7. **No-shows Card**
**Display:** `{count}`  
**Data Source:** `bookings` table  
**Column:** `booking_status`

**Query Logic:**
```sql
SELECT COUNT(*) as total 
FROM bookings 
WHERE booking_status IN ('no_show', 'no show')
  [AND booking_start_at BETWEEN {start} AND {end} 23:59:59]  -- if date filter applied
```

**Business Logic:**
- Counts bookings where client didn't show up
- Handles both formats: 'no_show' (underscore) and 'no show' (space)
- Represents confirmed sessions where client was absent

**Frontend Display:**
```typescript
{ title: 'No-shows', value: (statsData.noShows || 0).toString() }
```

---

## Date Filtering Logic

### Default Behavior (No Date Filter)
- Shows **all-time** statistics
- No date range restrictions applied

### With Date Filter
- User selects month or custom date range
- Query adds: `AND booking_start_at BETWEEN {start} AND {end} 23:59:59`
- End date includes full day by adding `23:59:59`

### Month Options
Generated dynamically from October 2025 to current month + 1:
```typescript
const startDate = new Date(2025, 9, 1); // Oct 2025
const currentDate = new Date();
const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
```

---

## Last Month Comparison (Currently Not Displayed)

The API also calculates last month statistics for comparison, but they're not currently shown in the UI:

```typescript
const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
```

**Available but unused:**
- `lastMonthSessions`
- `lastMonthFreeConsultations`
- `lastMonthCancelled`
- `lastMonthRefunds`
- `lastMonthNoShows`

---

## Database Tables Used

### Primary Table: `bookings`
**Key Columns:**
- `booking_id` - Unique identifier
- `booking_status` - Status: confirmed, cancelled, canceled, no_show, no show, rescheduled
- `booking_start_at` - Session start timestamp (used for date filtering)
- `invitee_payment_amount` - Payment amount in rupees
- `refund_amount` - Refund amount in rupees
- `refund_status` - Refund status: initiated, completed, processed, failed
- `booking_subject` - Contains "Free Consultation" for free sessions

---

## Known Issues & Recommendations

### Issue 1: Free Consultations Count
**Current:** Counts all bookings with zero/null payment  
**Problem:** May include non-free-consultation zero-amount bookings  
**Fix:** Use `booking_subject LIKE '%Free Consultation%'`

### Issue 2: Status Variations
**Current:** Handles 'cancelled' vs 'canceled' and 'no_show' vs 'no show'  
**Recommendation:** Standardize status values in database

### Issue 3: Revenue Calculation
**Current:** Includes no-show bookings in revenue  
**Consideration:** Verify if no-shows should be counted as revenue

---

## Frontend Component

**File:** `/components/Dashboard.tsx`  
**Lines:** 85-92 (Stats state initialization)  
**Lines:** 237-244 (Stats data mapping)

**Stats State:**
```typescript
const [stats, setStats] = useState([
  { title: 'Revenue', value: '₹0', lastMonth: '₹0' },
  { title: 'Refunded', value: '₹0', lastMonth: '₹0' },
  { title: 'Sessions', value: '0', lastMonth: '0' },
  { title: 'Free Consultations', value: '0', lastMonth: '0' },
  { title: 'Cancelled', value: '0', lastMonth: '0' },
  { title: 'Refunds', value: '0', lastMonth: '0' },
  { title: 'No-shows', value: '0', lastMonth: '0' },
]);
```

---

## Testing Queries

To verify stats manually, run these queries:

```sql
-- Revenue
SELECT COALESCE(SUM(invitee_payment_amount), 0) as total_revenue
FROM bookings 
WHERE booking_status NOT IN ('cancelled', 'canceled');

-- Refunded Amount
SELECT COALESCE(SUM(refund_amount), 0) as total_refunded
FROM bookings 
WHERE refund_status IS NOT NULL;

-- Sessions
SELECT COUNT(*) as total_sessions
FROM bookings 
WHERE booking_status NOT IN ('cancelled', 'canceled', 'no_show', 'no show');

-- Free Consultations (Correct)
SELECT COUNT(*) as free_consultations
FROM bookings 
WHERE booking_subject LIKE '%Free Consultation%';

-- Cancelled
SELECT COUNT(*) as cancelled_count
FROM bookings 
WHERE booking_status IN ('cancelled', 'canceled');

-- Refunds Count
SELECT COUNT(*) as refunds_count
FROM bookings 
WHERE refund_status IS NOT NULL;

-- No-shows
SELECT COUNT(*) as no_shows
FROM bookings 
WHERE booking_status IN ('no_show', 'no show');
```

---

## Summary

| Card | Source | Key Column | Excludes | Includes |
|------|--------|------------|----------|----------|
| Revenue | bookings | invitee_payment_amount | cancelled, canceled | confirmed, rescheduled, no-show |
| Refunded | bookings | refund_amount | refund_status IS NULL | All refund statuses |
| Sessions | bookings | booking_status | cancelled, canceled, no_show, no show | confirmed, rescheduled |
| Free Consultations | bookings | invitee_payment_amount | payment > 0 | payment = 0 or NULL |
| Cancelled | bookings | booking_status | All others | cancelled, canceled |
| Refunds | bookings | refund_status | refund_status IS NULL | All refund statuses |
| No-shows | bookings | booking_status | All others | no_show, no show |

---

**Last Updated:** January 2026  
**Database:** PostgreSQL (safestories_db)  
**API Version:** 1.0
