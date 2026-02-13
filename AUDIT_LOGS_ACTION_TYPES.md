# Audit Logs - Action Types Analysis

## All Action Types Currently Used

Based on code analysis, here are all the action types being logged:

### 1. **copy_appointment**
- **Where**: TherapistDashboard.tsx (line 599)
- **Current Format**: `COPY APPOINTMENT` (uppercase with space)
- **Description Example**: "Ishika copied appointment details"
- **Client**: Yes (appointment client name)

### 2. **send_whatsapp**
- **Where**: TherapistDashboard.tsx (line 695)
- **Current Format**: `SEND WHATSAPP` (uppercase with space)
- **Description Example**: "Ishika sent WhatsApp notification"
- **Client**: Yes (appointment client name)

### 3. **raise_sos**
- **Where**: TherapistDashboard.tsx (line 954)
- **Current Format**: `RAISE SOS` (uppercase with space)
- **Description Example**: "Ishika raised SOS ticket with risk assessment (Severity: 3)"
- **Client**: Yes (booking client name)

### 4. **client_transfer**
- **Where**: server/index.ts (line 1786)
- **Current Format**: `CLIENT TRANSFER` (uppercase with space)
- **Description Example**: "Transferred Meera from Ishika to Pooja"
- **Client**: Yes (transferred client name)

### 5. **login** (potential - from getActionColor function)
- **Where**: Referenced in AuditLogs.tsx color logic
- **Current Format**: `LOGIN` (uppercase)
- **Description Example**: "User logged in"
- **Client**: No

### 6. **logout** (potential - from getActionColor function)
- **Where**: Referenced in AuditLogs.tsx color logic
- **Current Format**: `LOGOUT` (uppercase)
- **Description Example**: "User logged out"
- **Client**: No

### 7. **cancel** (potential - from getActionColor function)
- **Where**: Referenced in AuditLogs.tsx color logic
- **Current Format**: `CANCEL` (uppercase)
- **Description Example**: "Booking cancelled"
- **Client**: Likely yes

### 8. **reschedule** (potential - from getActionColor function)
- **Where**: Referenced in AuditLogs.tsx color logic
- **Current Format**: `RESCHEDULE` (uppercase)
- **Description Example**: "Booking rescheduled"
- **Client**: Likely yes

---

## Current Formatting Logic

In `AuditLogs.tsx` (line 145):
```typescript
{log.action_type.replace(/_/g, ' ')}
```

This converts:
- `copy_appointment` → `copy appointment` (lowercase)
- `send_whatsapp` → `send whatsapp` (lowercase)
- `raise_sos` → `raise sos` (lowercase)
- `client_transfer` → `client transfer` (lowercase)

Then it's displayed in **UPPERCASE** via CSS class `uppercase`.

---

## Current Display Issues

### Example 1: SOS Ticket
**Raw Data**:
- Timestamp: `Fri, Feb 6, 2026, 02:45 PM IST`
- Therapist: `Ishika`
- Action: `raise_sos`
- Description: `Ishika raised SOS ticket with risk assessment (Severity: 3)`
- Client: `Meera`

**Current Display** (all concatenated):
```
Fri, Feb 6, 2026, 02:45 PM ISTIshikaraise sosIshika raised SOS ticket with risk assessment (Severity: 3)Meera
```

### Example 2: Copy Appointment
**Raw Data**:
- Timestamp: `Mon, Jan 19, 2026, 03:25 PM IST`
- Therapist: `Ishika`
- Action: `copy_appointment`
- Description: `Ishika copied appointment details`
- Client: `Harshita Saxena`

**Current Display** (all concatenated):
```
Mon, Jan 19, 2026, 03:25 PM ISTIshikacopy appointmentIshika copied appointment detailsHarshita Saxena
```

---

## Proposed Action Type Display Names

| Database Value | Current Display | Proposed Display |
|----------------|----------------|------------------|
| `copy_appointment` | `COPY APPOINTMENT` | `Copy Appointment` |
| `send_whatsapp` | `SEND WHATSAPP` | `Send WhatsApp` |
| `raise_sos` | `RAISE SOS` | `Raise SOS` |
| `client_transfer` | `CLIENT TRANSFER` | `Client Transfer` |
| `login` | `LOGIN` | `Login` |
| `logout` | `LOGOUT` | `Logout` |
| `cancel` | `CANCEL` | `Cancel Booking` |
| `reschedule` | `RESCHEDULE` | `Reschedule Booking` |

---

## Proposed Timestamp Format

**Current**: `Fri, Feb 6, 2026, 02:45 PM IST` (too long)

**Option 1** (Shorter): `Feb 6, 2026 02:45 PM`
**Option 2** (With day): `Feb 6, 2026 (Fri) 02:45 PM`
**Option 3** (Compact): `06 Feb 2026, 02:45 PM`

---

## Questions for You

1. **Action Type Format**: Do you want Title Case (e.g., "Copy Appointment") or keep UPPERCASE?

2. **Timestamp Format**: Which format do you prefer? (Option 1, 2, or 3)

3. **Table Layout**: The main issue seems to be table rendering - columns are concatenating. Should I fix the table CSS/structure?

4. **Color Coding**: Current colors:
   - Green: login
   - Gray: logout
   - Red: cancel
   - Orange: reschedule
   - Blue: everything else
   
   Do you want to keep these or change?

5. **Any other action types** I missed that should be logged?

Please let me know your preferences and I'll implement the changes!
