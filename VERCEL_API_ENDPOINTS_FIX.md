# Vercel API Endpoints Fix

## Issue
Progress notes and Send Booking Link features were working in local development but failing in production (Vercel).

## Root Cause
Missing API endpoints in `api/index.ts` (used by Vercel) that existed in `server/index.ts` (used locally).

## Errors in Production
1. `GET /api/client-therapy-type` - 404 (Not Found)
2. `GET /api/progress-notes` - 404 (Not Found)
3. `GET /api/free-consultation-notes` - 404 (Not Found)
4. `POST /api/send-booking-link` - 500 (Internal Server Error due to missing dependency)

## Solution
Added 5 missing endpoints to `api/index.ts`:

### 1. Get Client Therapy Type (NEW)
```typescript
GET /api/client-therapy-type?email=X&phone=Y
```
- Returns the most recent therapy type for a client
- Used by Send Booking Link feature to auto-fill therapy type
- Falls back to "Individual Therapy" if no bookings found

### 2. Get Progress Notes List (NEW)
```typescript
GET /api/progress-notes?client_id=X
```
- Fetches from BOTH tables:
  - `client_progress_notes` (new SOAP format)
  - `client_session_notes` (old session notes format)
- Merges and sorts by date descending
- Returns unified list with `note_type` field

### 3. Get Single Progress Note (NEW)
```typescript
GET /api/progress-notes/:id
```
- Fetches single progress note detail
- Used by ProgressNoteDetail component

### 4. Get Free Consultation Notes List (NEW)
```typescript
GET /api/free-consultation-notes?client_id=X
```
- Fetches pre-therapy consultation notes
- Includes assigned therapist name via JOIN

### 5. Get Single Free Consultation Note (NEW)
```typescript
GET /api/free-consultation-notes/:id
```
- Fetches single free consultation note detail
- Used by FreeConsultationDetail component

## Files Modified
- `api/index.ts` - Added 5 endpoints (+158 lines)

## Commits
1. `5f31b5c` - Complete therapy documentation system and All Clients updates
2. `3fbef76` - Add missing API endpoints for progress notes and client therapy type

## Testing Checklist
- [ ] Progress Notes tab shows both old and new format notes
- [ ] Free Consultation notes display correctly
- [ ] Send Booking Link works from Leads tab
- [ ] Client therapy type auto-fills correctly
- [ ] No 404 errors in browser console

## Deployment
Pushed to main branch. Vercel will auto-deploy.
Check deployment status: https://vercel.com/dashboard

## Notes
- `server/index.ts` is for local development (port 3002)
- `api/index.ts` is for Vercel production
- Always ensure both files have the same endpoints
