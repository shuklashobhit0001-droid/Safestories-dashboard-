# Admin Dashboard Stats Cards - Analysis

## 📊 Current Stats Cards (6 cards)

### 1. **Revenue** 💰
- **Display:** `₹{amount}` (formatted with commas)
- **Position:** First card (top-left)
- **Data Source:** 
  - API: `/api/dashboard/stats`
  - Query: `SUM(invitee_payment_amount)` from `bookings` table
  - Filter: Excludes `booking_status IN ('cancelled', 'canceled')`
  - Date Filter: Optional (based on selected date range)

### 2. **Sessions** 📅
- **Display:** Count number
- **Position:** Second card
- **Data Source:**
  - API: `/api/dashboard/stats`
  - Query: `COUNT(*)` from `bookings` table
  - Filter: `booking_status IN ('confirmed', 'rescheduled')`
  - Date Filter: Optional

### 3. **Free Consultations** 🆓
- **Display:** Count number
- **Position:** Third card
- **Data Source:**
  - API: `/api/dashboard/stats`
  - Query: `COUNT(*)` from `bookings` table
  - Filter: `invitee_payment_amount = 0 OR invitee_payment_amount IS NULL`
  - Date Filter: Optional

### 4. **Cancelled** ❌
- **Display:** Count number
- **Position:** Fourth card
- **Data Source:**
  - API: `/api/dashboard/stats`
  - Query: `COUNT(*)` from `bookings` table
  - Filter: `booking_status IN ('cancelled', 'canceled')`
  - Date Filter: Optional

### 5. **Refunds** 💸
- **Display:** Count number (currently shows COUNT, not amount)
- **Position:** Fifth card
- **Data Source:**
  - API: `/api/dashboard/stats`
  - Query: `COUNT(*)` from `bookings` table
  - Filter: `refund_status IN ('completed', 'processed')`
  - Date Filter: Optional

### 6. **No-shows** 👻
- **Display:** Count number
- **Position:** Sixth card (last)
- **Data Source:**
  - API: `/api/dashboard/stats`
  - Query: `COUNT(*)` from `bookings` table
  - Filter: `booking_status = 'no_show'`
  - Date Filter: Optional

---

## 🎯 Proposed Change: Add "Refunded Amount" Card

### New Card: **Refunded** 💵
- **Display:** `₹{amount}` (formatted with commas)
- **Position:** After Revenue card (second position)
- **Data Source:**
  - API: `/api/dashboard/stats` (needs modification)
  - Query: `SUM(refund_amount)` from `bookings` table
  - Filter: `refund_status IN ('completed', 'processed')`
  - Date Filter: Optional

### Updated Card Order:
1. Revenue 💰
2. **Refunded 💵** ← NEW
3. Sessions 📅
4. Free Consultations 🆓
5. Cancelled ❌
6. Refunds (count) 💸
7. No-shows �

---

## 🔧 Implementation Requirements

### Backend Changes (server/index.ts):

**Add to `/api/dashboard/stats` endpoint:**

```typescript
// Add refunded amount query
const refundedAmount = hasDateFilter
  ? await pool.query(
      'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IN ($1, $2) AND booking_start_at BETWEEN $3 AND $4',
      ['completed', 'processed', start, `${end} 23:59:59`]
    )
  : await pool.query(
      'SELECT COALESCE(SUM(refund_amount), 0) as total FROM bookings WHERE refund_status IN ($1, $2)',
      ['completed', 'processed']
    );

// Add to response
res.json({
  revenue: revenue.rows[0].total,
  refundedAmount: refundedAmount.rows[0].total, // NEW
  sessions: sessions.rows[0].total,
  // ... rest
});
```

### Frontend Changes (components/Dashboard.tsx):

**Update stats array:**

```typescript
setStats([
  { title: 'Revenue', value: `₹${Number(statsData.revenue || 0).toLocaleString()}`, lastMonth: '₹0' },
  { title: 'Refunded', value: `₹${Number(statsData.refundedAmount || 0).toLocaleString()}`, lastMonth: '₹0' }, // NEW
  { title: 'Sessions', value: (statsData.sessions || 0).toString(), lastMonth: '0' },
  { title: 'Free Consultations', value: (statsData.freeConsultations || 0).toString(), lastMonth: '0' },
  { title: 'Cancelled', value: (statsData.cancelled || 0).toString(), lastMonth: '0' },
  { title: 'Refunds', value: (statsData.refunds || 0).toString(), lastMonth: '0' },
  { title: 'No-shows', value: (statsData.noShows || 0).toString(), lastMonth: '0' },
]);
```

**Update grid layout:**

```typescript
// Change from grid-cols-4 to grid-cols-4 (keep same, will wrap to 2 rows)
<div className="grid grid-cols-4 gap-4 mb-8">
```

OR

```typescript
// Change to 7 columns (might be too cramped)
<div className="grid grid-cols-7 gap-4 mb-8">
```

---

## 📝 Data Flow Summary

### Current Flow:
```
bookings table → /api/dashboard/stats → Dashboard.tsx → Stats Cards
```

### Data Fields Used:
- `invitee_payment_amount` → Revenue
- `booking_status` → Sessions, Cancelled, No-shows
- `refund_status` → Refunds (count)
- `refund_amount` → **NOT CURRENTLY USED** (will be used for new card)

### Database Table: `bookings`
**Relevant columns:**
- `invitee_payment_amount` (DECIMAL) - Payment amount
- `refund_amount` (DECIMAL) - Refund amount
- `booking_status` (VARCHAR) - Status: confirmed, cancelled, no_show, etc.
- `refund_status` (VARCHAR) - Status: completed, processed, requested, etc.
- `booking_start_at` (TIMESTAMP) - For date filtering

---

## ✅ Summary

**Current Cards:** 6 cards in 4-column grid (2 rows)
**After Change:** 7 cards in 4-column grid (2 rows)

**New Card Details:**
- **Name:** Refunded
- **Position:** After Revenue (2nd position)
- **Shows:** Total refunded amount in ₹
- **Data:** SUM of refund_amount where refund_status is completed/processed

**Files to Modify:**
1. `server/index.ts` - Add refundedAmount query and response
2. `components/Dashboard.tsx` - Add Refunded card to stats array

---

## ❓ Ready to Proceed?

The implementation is straightforward:
1. Add backend query for refunded amount
2. Add frontend card display
3. Test with existing data

Should I proceed with the implementation?
