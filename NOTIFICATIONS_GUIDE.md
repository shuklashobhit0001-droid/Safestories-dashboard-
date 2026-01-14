# Notifications System Guide

## Overview
The notifications system sends real-time alerts to admins and therapists for various events in the platform.

## Notification Types

### For Admins

1. **SOS Ticket** (`sos_ticket`)
   - When: Therapist raises an SOS ticket
   - Title: "SOS Ticket Raised"
   - Message: "{therapist_name} raised an SOS ticket for client {client_name}"

2. **New Booking** (`new_booking`)
   - When: New session is booked
   - Title: "New Booking Created"
   - Message: "{client_name} booked \"{session_name}\" with {therapist_name}"

3. **New Booking Request** (`new_booking_request`)
   - When: Admin sends booking link to client
   - Title: "New Booking Request"
   - Message: "New booking request from {client_name} for {therapy_type}"

4. **Booking Cancelled** (`booking_cancelled`)
   - When: Session is cancelled
   - Title: "Booking Cancelled"
   - Message: "Session \"{session_name}\" with {client_name} has been cancelled"

5. **Booking Rescheduled** (`booking_rescheduled`)
   - When: Session is rescheduled
   - Title: "Booking Rescheduled"
   - Message: "Session \"{session_name}\" with {client_name} has been rescheduled"

6. **No-Show Alert** (`no_show`)
   - When: Client doesn't show up for session
   - Title: "Client No-Show"
   - Message: "{client_name} did not show up for session \"{session_name}\""

7. **Client Transfer** (`client_transfer`)
   - When: Client is transferred between therapists
   - Title: "Client Transfer Completed"
   - Message: "{client_name} transferred from {old_therapist} to {new_therapist}"

8. **Session Notes Submitted** (`session_notes_submitted`)
   - When: Therapist submits session notes
   - Title: "Session Notes Submitted"
   - Message: "{therapist_name} submitted session notes for {client_name}"

9. **Refund Requested** (`refund_requested`)
   - When: Client requests a refund
   - Title: "Refund Requested"
   - Message: "{client_name} requested a refund of ₹{amount}"

10. **Refund Completed** (`refund_processed`)
    - When: Refund is processed
    - Title: "Refund Completed"
    - Message: "Refund of ₹{amount} processed for {client_name}"

### For Therapists

1. **New Booking Assigned** (`new_booking`)
   - When: New session is booked with them
   - Title: "New Booking Assigned"
   - Message: "New session \"{session_name}\" booked with {client_name}"

2. **Booking Cancelled** (`booking_cancelled`)
   - When: Their session is cancelled
   - Title: "Session Cancelled"
   - Message: "Your session \"{session_name}\" with {client_name} has been cancelled"

3. **Booking Rescheduled** (`booking_rescheduled`)
   - When: Their session is rescheduled
   - Title: "Session Rescheduled"
   - Message: "Your session \"{session_name}\" with {client_name} has been rescheduled"

4. **Client Transfer In** (`client_transfer_in`)
   - When: New client is transferred to them
   - Title: "New Client Assigned"
   - Message: "Client {client_name} has been transferred to you from {old_therapist}"

5. **Client Transfer Out** (`client_transfer_out`)
   - When: Their client is transferred away
   - Title: "Client Transferred"
   - Message: "Client {client_name} has been transferred to {new_therapist}"

## API Endpoints

### Get Notifications
```
GET /api/notifications?user_id={id}&user_role={role}
```

### Mark as Read
```
PUT /api/notifications/{notification_id}/read
```

### Mark All as Read
```
PUT /api/notifications/mark-all-read
Body: { user_id, user_role }
```

### Delete Notification
```
DELETE /api/notifications/{notification_id}
```

### Update Booking Status (triggers notifications)
```
POST /api/booking-status
Body: { booking_id, status, therapist_id, client_name, session_name }
```

### Submit Session Notes (triggers notifications)
```
POST /api/session-notes-submit
Body: { booking_id, therapist_id, therapist_name, client_name }
```

### Update Refund Status (triggers notifications)
```
POST /api/refund-status
Body: { booking_id, refund_status, client_name, therapist_id, refund_amount }
```

### Webhook for External Bookings
```
POST /api/webhook/booking-created
Body: { booking_id, client_name, session_name, therapist_name, therapist_id }
```

## Usage in Code

### Notify All Admins
```typescript
import { notifyAllAdmins } from '../lib/notifications.js';

await notifyAllAdmins(
  'notification_type',
  'Notification Title',
  'Notification message',
  'related_id' // optional
);
```

### Notify Specific Therapist
```typescript
import { notifyTherapist } from '../lib/notifications.js';

await notifyTherapist(
  therapist_id,
  'notification_type',
  'Notification Title',
  'Notification message',
  'related_id' // optional
);
```

## Database Schema

```sql
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  user_role VARCHAR(20) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);
```

## Future Enhancements

### Potential Additional Notifications:
- Session reminders (24h, 1h before)
- New client registration
- Payment received
- Therapist availability changes
- Admin messages/announcements
- System maintenance alerts
