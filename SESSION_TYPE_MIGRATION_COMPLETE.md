# SESSION_TYPE COLUMN - MIGRATION COMPLETE ✅

## 📊 MIGRATION RESULTS

**Date:** February 16, 2026  
**Status:** ✅ **COMPLETED SUCCESSFULLY**

---

## ✅ WHAT WAS DONE

### 1. Added Columns:
- ✅ `session_type VARCHAR(255)` - Stores exact booking resource name
- ✅ `paperform_submission_id VARCHAR(255)` - For tracking form submissions

### 2. Populated Data:
- ✅ **78 records updated** with exact `booking_resource_name` from bookings table
- ✅ Created index on `session_type` for performance

---

## 📋 CURRENT SESSION_TYPE DISTRIBUTION

| Session Type | Count | Percentage |
|-------------|-------|------------|
| Individual Therapy Session with Ishika Mahajan | 24 | 31% |
| Individual Therapy Session with Anjali | 18 | 23% |
| Individual Therapy Session with Muskan Negi | 13 | 17% |
| Individual Therapy Session with Aastha Yagnik | 11 | 14% |
| Individual Therapy Session with Ambika | 6 | 8% |
| **Free Consultation - SafeStories** | **5** | **6%** |
| Adolescent Therapy Session with Ishika Mahajan | 1 | 1% |
| **TOTAL** | **78** | **100%** |

---

## 🎯 SESSION TYPE VALUES IN DATABASE

### **Exact Values (as copied from bookings):**

**Free Consultations:**
- `Free Consultation - SafeStories` (5 records)

**Paid Sessions:**
- `Individual Therapy Session with Ishika Mahajan` (24 records)
- `Individual Therapy Session with Anjali` (18 records)
- `Individual Therapy Session with Muskan Negi` (13 records)
- `Individual Therapy Session with Aastha Yagnik` (11 records)
- `Individual Therapy Session with Ambika` (6 records)
- `Adolescent Therapy Session with Ishika Mahajan` (1 record)

---

## 🔧 HOW TO USE session_type

### **For Webhook Routing:**

```typescript
// In webhook endpoint
const docForm = await pool.query(
  'SELECT session_type FROM client_doc_form WHERE booking_id = $1',
  [bookingId]
);

const sessionType = docForm.rows[0].session_type;

// Route based on session type
if (sessionType === 'Free Consultation - SafeStories') {
  // Insert into free_consultation_pretherapy_notes
  await insertFreeConsultationNotes(data);
} else {
  // All other types are paid sessions
  // Insert into client_progress_notes, client_case_history, client_therapy_goals
  await insertTherapyDocumentation(data);
}
```

### **For Future Records:**

```typescript
// When creating new client_doc_form entry
const booking = await pool.query(
  'SELECT booking_resource_name FROM bookings WHERE booking_id = $1',
  [bookingId]
);

// Copy exact booking_resource_name
await pool.query(`
  INSERT INTO client_doc_form (
    booking_id, 
    paperform_link, 
    session_type, 
    status
  )
  VALUES ($1, $2, $3, 'pending')
`, [
  bookingId, 
  paperformLink, 
  booking.rows[0].booking_resource_name  // Exact value
]);
```

---

## 📊 VERIFICATION QUERIES

### **Check all session types:**
```sql
SELECT 
  session_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM client_doc_form
GROUP BY session_type
ORDER BY count DESC;
```

### **Check free consultations:**
```sql
SELECT 
  link_id,
  booking_id,
  session_type,
  status
FROM client_doc_form
WHERE session_type = 'Free Consultation - SafeStories';
```

### **Check paid sessions:**
```sql
SELECT 
  link_id,
  booking_id,
  session_type,
  status
FROM client_doc_form
WHERE session_type != 'Free Consultation - SafeStories'
ORDER BY link_id DESC
LIMIT 10;
```

### **Check records without session_type:**
```sql
SELECT 
  link_id,
  booking_id,
  status
FROM client_doc_form
WHERE session_type IS NULL;
```
**Expected:** 0 records (all should be populated)

---

## 🚀 NEXT STEPS

### **1. Configure Paperform Webhooks**

You now have the flexibility to:

**Option A: Two Separate Forms (Recommended)**
- Form 1: Free Consultation → Check if `session_type = 'Free Consultation - SafeStories'`
- Form 2: Therapy Documentation → Check if `session_type != 'Free Consultation - SafeStories'`

**Option B: Single Form with Routing**
- One form for all sessions
- Webhook checks `session_type` and routes accordingly

---

### **2. Webhook Implementation**

**Endpoint:** `POST /api/paperform-webhook`

```typescript
app.post('/api/paperform-webhook', async (req, res) => {
  const { booking_id, submission_id, data } = req.body;
  
  // Get session type
  const docForm = await pool.query(
    'SELECT session_type FROM client_doc_form WHERE booking_id = $1',
    [booking_id]
  );
  
  const sessionType = docForm.rows[0]?.session_type;
  
  // Route based on session type
  if (sessionType === 'Free Consultation - SafeStories') {
    // Free consultation logic
    await pool.query(`
      INSERT INTO free_consultation_pretherapy_notes (...)
      VALUES (...)
    `);
  } else {
    // Paid session logic
    // Determine if first session or follow-up
    const sessionNumber = data.session_number || 1;
    
    if (sessionNumber === 1) {
      // Insert case history, goals, and progress notes
      await insertCaseHistory(data);
      await insertTherapyGoals(data);
      await insertProgressNotes(data);
    } else {
      // Insert only progress notes
      await insertProgressNotes(data);
    }
  }
  
  // Update client_doc_form
  await pool.query(`
    UPDATE client_doc_form 
    SET status = 'completed', 
        paperform_submission_id = $1
    WHERE booking_id = $2
  `, [submission_id, booking_id]);
  
  res.json({ success: true });
});
```

---

### **3. Update Backend Code**

**Location:** Where paperform links are generated

**Add:**
```typescript
// Get booking resource name
const booking = await pool.query(
  'SELECT booking_resource_name FROM bookings WHERE booking_id = $1',
  [bookingId]
);

// Insert with exact session_type
await pool.query(`
  INSERT INTO client_doc_form (
    booking_id, 
    paperform_link, 
    session_type, 
    status
  )
  VALUES ($1, $2, $3, 'pending')
`, [
  bookingId, 
  paperformLink, 
  booking.rows[0].booking_resource_name
]);
```

---

## 📝 CONFIGURATION FLEXIBILITY

With exact session types stored, you can now:

1. ✅ **Route by exact match:**
   - `session_type = 'Free Consultation - SafeStories'` → Free consultation form
   - Everything else → Therapy documentation form

2. ✅ **Route by pattern:**
   - `session_type LIKE '%Free Consultation%'` → Free consultation
   - `session_type LIKE '%Individual%'` → Individual therapy
   - `session_type LIKE '%Couple%'` → Couples therapy
   - `session_type LIKE '%Adolescent%'` → Adolescent therapy

3. ✅ **Route by therapist:**
   - `session_type LIKE '%Ishika Mahajan%'` → Ishika's clients
   - `session_type LIKE '%Anjali%'` → Anjali's clients

4. ✅ **Future-proof:**
   - New booking types automatically get correct session_type
   - No code changes needed for new therapists or session types

---

## ✅ SUMMARY

**Migration Status:** ✅ COMPLETE  
**Records Updated:** 78/78 (100%)  
**Columns Added:** 2 (session_type, paperform_submission_id)  
**Index Created:** ✅ Yes  
**Data Verified:** ✅ Yes

**Ready for:**
- Paperform webhook configuration
- Backend code updates
- Form routing logic implementation

---

**Next: Should I proceed with creating the webhook endpoint implementation?**
