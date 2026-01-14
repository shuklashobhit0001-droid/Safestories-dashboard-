# Timezone Usage Across Application

## Admin Dashboard

### 1. **Dashboard View (Main)**
- **Upcoming Bookings Section**
  - API: `/api/dashboard/bookings`
  - Field: `booking_invitee_time`
  - **Status**: ✅ HAS convertToIST
  - Display: Shows IST timezone

### 2. **All Clients**
- **Client List**
  - API: `/api/clients`
  - Field: `latest_booking_date` (used for logic, not display)
  - **Status**: ⚠️ NO timezone display (only used for comparison)

### 3. **All Therapists**
- **Therapist Details Modal**
  - API: `/api/therapist-details`
  - Field: `booking_invitee_time`
  - **Status**: ✅ HAS convertToIST
  - Display: Shows IST timezone

### 4. **Appointments**
- **Appointments List**
  - API: `/api/appointments`
  - Field: `booking_invitee_time`
  - **Status**: ❌ NO convertToIST
  - Display: Shows original timezone (GMT+XX:XX)

### 5. **Refunds & Cancellations**
- **Refunds List**
  - API: `/api/refunds`
  - Field: `session_timings` (from refund_cancellation_table)
  - **Status**: ❌ NO convertToIST
  - Display: Shows original timezone

---

## Therapist Dashboard

### 1. **Dashboard View (Main)**
- **Upcoming Bookings Section**
  - API: `/api/therapist-stats`
  - Field: `booking_invitee_time`
  - **Status**: ✅ HAS convertToIST
  - Display: Shows IST timezone

### 2. **My Clients**
- **Client Details View → Appointments List**
  - API: `/api/client-appointments`
  - Field: `booking_invitee_time`
  - **Status**: ✅ HAS convertToIST (just added)
  - Display: Shows IST timezone

### 3. **My Appointments**
- **Appointments List**
  - API: `/api/therapist-appointments`
  - Field: `booking_invitee_time`
  - **Status**: ❌ NO convertToIST
  - Display: Shows original timezone (GMT+XX:XX)

---

## Summary

### ✅ Has IST Conversion (Working):
1. Admin Dashboard → Upcoming Bookings
2. Admin Dashboard → Therapist Details Modal
3. Therapist Dashboard → Upcoming Bookings
4. Therapist Dashboard → Client Details Appointments

### ❌ Missing IST Conversion (Needs Fix):
1. **Admin Dashboard → Appointments** (`/api/appointments`)
2. **Admin Dashboard → Refunds & Cancellations** (`/api/refunds`)
3. **Therapist Dashboard → My Appointments** (`/api/therapist-appointments`)

---

## Recommendation

Add `convertToIST` function to these 3 endpoints:
1. `handleAppointments` - Admin Appointments page
2. `handleRefunds` - Admin Refunds page
3. `handleTherapistAppointments` - Therapist My Appointments page

This will ensure consistent IST timezone display across the entire application.
