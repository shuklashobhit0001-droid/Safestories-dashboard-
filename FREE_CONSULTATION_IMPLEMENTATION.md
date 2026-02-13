# ✅ Free Consultation vs Paid Session Logic - COMPLETE

## 🎯 Feature Overview

The system now intelligently displays different UI based on whether a client has only free consultation sessions or has booked paid therapy sessions.

---

## 📋 Three Scenarios

### Scenario 1: Client Has ONLY Free Consultation
**Condition**: `hasPaidSessions = false`, `hasFreeConsultation = true`

**UI Behavior**:
- **Tabs Shown**: 
  - Overview
  - Pre-therapy Notes (renamed from "Case History")
- **Tabs Hidden**: 
  - Progress notes
  - Goal Tracking

**Pre-therapy Notes Tab**:
- Shows list of free consultation notes
- Purple-themed cards with "FREE CONSULTATION" badge
- Click to view full consultation details
- Data from `free_consultation_pretherapy_notes` table

---

### Scenario 2: Client Has Paid Sessions (with or without free consultation)
**Condition**: `hasPaidSessions = true`

**UI Behavior**:
- **Tabs Shown**: 
  - Overview
  - Case History (original name)
  - Progress notes
  - Goal Tracking

**Progress notes Tab**:
- Shows ALL session notes (paid + free consultation)
- Free consultation notes appear at the top with purple styling
- Regular progress notes appear below
- Click free consultation note → shows `FreeConsultationDetail`
- Click regular note → shows `ProgressNoteDetail`

**Case History Tab**:
- Shows first paid session case history
- Data from `client_case_history` table

---

### Scenario 3: Client Has ONLY Paid Sessions (no free consultation)
**Condition**: `hasPaidSessions = true`, `hasFreeConsultation = false`

**UI Behavior**:
- Same as Scenario 2
- No free consultation notes in Progress notes list
- Standard therapy documentation flow

---

## 🔌 Backend API Endpoints

### 1. Check Client Session Type
```
GET /api/client-session-type?client_id=+919876543210

Response:
{
  "success": true,
  "data": {
    "hasPaidSessions": false,
    "hasFreeConsultation": true
  }
}
```

**Logic**:
- Checks if `client_case_history` table has entry for client → `hasPaidSessions`
- Checks if `free_consultation_pretherapy_notes` table has entry → `hasFreeConsultation`

---

### 2. Get Free Consultation Notes (List)
```
GET /api/free-consultation-notes?client_id=+919876543210

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_name": "+919876543210",
      "session_date": "2026-02-10",
      "presenting_concerns": "Anxiety and stress",
      "assigned_therapist_name": "Dr. Smith",
      ...
    }
  ]
}
```

---

### 3. Get Single Free Consultation Note
```
GET /api/free-consultation-notes/1

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "presenting_concerns": "...",
    "therapy_overview_given": true,
    "preferred_languages": "English, Hindi",
    ...
  }
}
```

---

## 🎨 Frontend Components

### 1. FreeConsultationDetail.tsx (NEW)
**Purpose**: Display full free consultation note details

**Features**:
- Purple-themed UI to distinguish from regular notes
- Shows all consultation fields:
  - Presenting concerns
  - Therapy overview given
  - Client questions & answers
  - Next steps & preferences
  - Clinical concerns (highlighted in orange if present)
  - Suicidal thoughts (highlighted if mentioned)
  - Other notes
- Back button to return to list
- Session status badge

---

### 2. ProgressNotesTab.tsx (UPDATED)
**New Props**:
- `hasFreeConsultation?: boolean` - Whether to fetch and show free consultation notes

**New Behavior**:
- Fetches both progress notes AND free consultation notes
- Merges them into single list
- Free consultation notes shown with purple styling
- Calls `onViewNote(noteId, isFreeConsultation)` with flag

---

### 3. TherapistDashboard.tsx (UPDATED)
**New State**:
- `clientSessionType` - Stores hasPaidSessions and hasFreeConsultation flags
- `isFreeConsultationNote` - Tracks if viewing free consultation detail
- `selectedProgressNoteId` - Tracks which note is being viewed

**New Logic**:
- Fetches session type when client is selected
- Conditionally renders tabs based on `hasPaidSessions`
- Renames "Case History" to "Pre-therapy Notes" when only free consultation
- Routes to correct detail component based on note type

**Inline Component**:
- `FreeConsultationNotesList` - Shows list of free consultation notes in Pre-therapy Notes tab

---

## 🔄 Data Flow

### When Client is Selected:
```
1. fetchClientDetails() called
2. Fetch /api/client-session-type
3. Store hasPaidSessions and hasFreeConsultation
4. Render tabs conditionally
5. Set default tab to 'overview'
```

### When Viewing Progress notes (Paid Client):
```
1. ProgressNotesTab renders
2. Fetches /api/progress-notes
3. If hasFreeConsultation, also fetches /api/free-consultation-notes
4. Merges both lists
5. Free consultation notes shown at top with purple styling
6. Click note → Check isFreeConsultation flag
7. Show FreeConsultationDetail or ProgressNoteDetail accordingly
```

### When Viewing Pre-therapy Notes (Free Consultation Only):
```
1. FreeConsultationNotesList renders
2. Fetches /api/free-consultation-notes
3. Shows purple-themed list
4. Click note → Show FreeConsultationDetail
```

---

## 🎨 Visual Differences

### Free Consultation Notes:
- **Color**: Purple theme (bg-purple-50, border-purple-200)
- **Badge**: "FREE CONSULTATION" in purple
- **Icon**: Purple chevron
- **Fields**: Consultation-specific (presenting concerns, preferences, assigned therapist)

### Regular Progress Notes:
- **Color**: White/teal theme
- **Badge**: Session number + risk level
- **Icon**: Gray chevron
- **Fields**: SOAP format (subjective, objective, assessment, plan)

---

## 📊 Database Tables Used

### 1. `free_consultation_pretherapy_notes`
- Stores free consultation session data
- Fields: presenting_concerns, therapy_overview_given, preferred_languages, assigned_therapist_name, etc.

### 2. `client_case_history`
- Stores first paid session case history
- Used to determine if client has paid sessions

### 3. `client_progress_notes`
- Stores regular session progress notes
- SOAP format notes

---

## ✅ Implementation Checklist

- [x] Create API endpoint: `/api/client-session-type`
- [x] Create API endpoint: `/api/free-consultation-notes` (list)
- [x] Create API endpoint: `/api/free-consultation-notes/:id` (single)
- [x] Create `FreeConsultationDetail.tsx` component
- [x] Update `ProgressNotesTab.tsx` to handle free consultation notes
- [x] Update `TherapistDashboard.tsx` with conditional logic
- [x] Add `FreeConsultationNotesList` inline component
- [x] Add state for tracking session type
- [x] Add state for tracking note type (free vs paid)
- [x] Conditional tab rendering
- [x] Tab renaming logic (Case History → Pre-therapy Notes)
- [x] No TypeScript errors

---

## 🧪 Testing Scenarios

### Test 1: Free Consultation Only Client
1. Create client with only free consultation booking
2. Add free consultation note via N8N
3. Open client in dashboard
4. Verify only 2 tabs shown: Overview, Pre-therapy Notes
5. Click Pre-therapy Notes → See purple-themed list
6. Click note → See full consultation details
7. Verify no Progress notes or Goal Tracking tabs

### Test 2: Paid Session Client (with prior free consultation)
1. Client had free consultation before
2. Now has paid therapy session
3. Add case history and progress note
4. Open client in dashboard
5. Verify 4 tabs shown: Overview, Case History, Progress notes, Goal Tracking
6. Click Progress notes → See free consultation note at top (purple) + regular notes below
7. Click free consultation note → See FreeConsultationDetail
8. Click regular note → See ProgressNoteDetail
9. Click Case History → See case history (not free consultation)

### Test 3: Paid Session Client (no free consultation)
1. Client directly booked paid session
2. No free consultation history
3. Open client in dashboard
4. Verify 4 tabs shown
5. Progress notes shows only regular notes
6. No purple-themed notes

---

## 📂 Files Modified

### Backend:
- `server/index.ts` - Added 3 new API endpoints

### Frontend Components:
- `components/FreeConsultationDetail.tsx` - NEW
- `components/ProgressNotesTab.tsx` - UPDATED
- `components/TherapistDashboard.tsx` - UPDATED

### Database:
- `free_consultation_pretherapy_notes` table (already created)

---

## 🚀 Status: READY FOR TESTING

All logic implemented and integrated. No TypeScript errors. Ready for end-to-end testing with real data.

---

**Last Updated**: February 13, 2026
**Feature**: Complete ✅
