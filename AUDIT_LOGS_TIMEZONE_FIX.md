# Audit Logs Timezone Fix

## Problem
Audit logs were using UTC timestamps with manual IST conversion (`+ 5.5 hours`) which worked locally but failed in production due to server timezone differences.

## Solution
Changed audit logs to use the same timezone logic as upcoming bookings - storing pre-formatted IST strings instead of UTC timestamps.

## Changes Made

### 1. Frontend (components/AuditLogs.tsx)
- **Before:** Converted UTC timestamp to IST by adding 5.5 hours
- **After:** Displays pre-formatted IST string directly (no conversion)

### 2. Backend (server/index.ts)
- **Added:** `getCurrentISTTimestamp()` helper function that returns formatted IST string
- **Updated:** All audit log insertions to use formatted IST strings instead of `NOW()`
- **Format:** `"Wed, Jan 15, 2025, 02:30 PM IST"`

### 3. Database Schema (scripts/createAuditLogsTable.ts)
- **Before:** `timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **After:** `timestamp VARCHAR(255)`

### 4. Migration Script (scripts/migrateAuditLogsTimestamp.ts)
- Converts existing UTC timestamps to IST formatted strings
- Replaces old TIMESTAMP column with VARCHAR column

## How to Apply

1. Run migration to update existing data:
   ```bash
   npm run ts-node scripts/migrateAuditLogsTimestamp.ts
   ```

2. Restart the server to apply new logic

## Result
- Audit logs now display consistently in IST across local and production environments
- Matches the behavior of upcoming bookings section
- No more timezone conversion issues

## Timezone Used
**IST (Indian Standard Time) - UTC+5:30**
