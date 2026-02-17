# SESSION_TYPE COLUMN - IMPLEMENTATION SUMMARY

## 📊 ANALYSIS RESULTS

### **Current Booking Distribution:**
- **Individual Therapy Sessions:** 85 bookings (84%)
- **Free Consultations:** 13 bookings (13%)
- **Couples Therapy:** 2 bookings (2%)
- **Adolescent Therapy:** 1 booking (1%)
- **Total:** 101 bookings

### **Client_Doc_Form Records:**
- **Total:** 78 records
- **Completed:** 13 records (17%)
- **Pending/NULL:** 65 records (83%)

---

## 🎯 SESSION_TYPE VALUES

### **Chosen Approach: Simple (2 values)**

| Value | Description | Count | Use Case |
|-------|-------------|-------|----------|
| `free_consultation` | Free consultation sessions | 13 | Form 2: Free Consultation Notes |
| `paid_session` | All paid therapy sessions | 65 | Form 1: Therapy Documentation Sheet |

### **Why Simple Approach?**
1. ✅ Matches your two Paperform forms exactly
2. ✅ Easy to maintain and understand
3. ✅ Can add granularity later if needed
4. ✅ Clear routing logic for webhooks

---

## 🔄 DATA POPULATION STRATEGY

### **For Existing 78 Records (NOW):**

**Method:** SQL UPDATE based on booking_resource_name pattern

```sql
UPDATE client_doc_form cdf
SET session_type = CASE 
  WHEN b.booking_resource_name LIKE '%Free Consultation%' 
    THEN 'free_consultation'
  ELSE 'paid_session'
END
FROM bookings b
WHERE cdf.booking_id = b.booking_id;
```

**Expected Result:**
- 13 records → `free_consultation`
- 65 records → `paid_session`

---

### **For Future Records (AUTOMATIC):**

**Method:** Determine from booking when creating client_doc_form entry

```typescript
// Backend logic when generating paperform link
const booking = await pool.query(
  'SELECT booking_resource_name FROM bookings WHERE booking_id = $1',
  [bookingId]
);

const sessionType = booking.rows[0].booking_resource_name.includes('Free Consultation')
  ? 'free_consultation'
  : 'paid_session';

// Insert with session_type
await pool.query(`
  INSERT INTO client_doc_form (
    booking_id, 
    paperform_link, 
    session_type, 
    status
  )
  VALUES ($1, $2, $3, 'pending')
`, [bookingId, paperformLink, sessionType]);
```

---

## 📋 MIGRATION SCRIPT

### **File:** `scripts/addSessionTypeColumn.ts`

**What it does:**
1. ✅ Adds `session_type VARCHAR(50)` column
2. ✅ Adds `paperform_submission_id VARCHAR(255)` column
3. ✅ Updates all existing records with correct session_type
4. ✅ Creates index for performance
5. ✅ Verifies the migration

**How to run:**
```bash
npx tsx scripts/addSessionTypeColumn.ts
```

---

## 🔍 VERIFICATION QUERIES

### **Check session_type distribution:**
```sql
SELECT 
  session_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM client_doc_form
GROUP BY session_type;
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

### **Verify against bookings:**
```sql
SELECT 
  cdf.link_id,
  cdf.booking_id,
  cdf.session_type,
  b.booking_resource_name
FROM client_doc_form cdf
LEFT JOIN bookings b ON cdf.booking_id = b.booking_id
ORDER BY cdf.link_id DESC
LIMIT 10;
```

---

## 🚀 NEXT STEPS AFTER MIGRATION

### **1. Update Backend Code**

**File:** `server/index.ts`

**Location:** Where paperform links are generated

**Add:**
```typescript
// Determine session type from booking
const bookingResult = await pool.query(
  'SELECT booking_resource_name FROM bookings WHERE booking_id = $1',
  [bookingId]
);

const sessionType = bookingResult.rows[0]?.booking_resource_name?.includes('Free Consultation')
  ? 'free_consultation'
  : 'paid_session';

// Use in INSERT
await pool.query(`
  INSERT INTO client_doc_form (booking_id, paperform_link, session_type, status)
  VALUES ($1, $2, $3, 'pending')
`, [bookingId, paperformLink, sessionType]);
```

---

### **2. Create Webhook Endpoints**

**Two endpoints needed:**

**A. Free Consultation Webhook**
```typescript
app.post('/api/paperform-webhook/free-consultation', async (req, res) => {
  // Validate booking_id
  // Check session_type = 'free_consultation'
  // Insert into free_consultation_pretherapy_notes
  // Update client_doc_form status
});
```

**B. Therapy Documentation Webhook**
```typescript
app.post('/api/paperform-webhook/therapy-documentation', async (req, res) => {
  // Validate booking_id
  // Check session_type = 'paid_session'
  // Route to appropriate tables based on session_number
  // Update client_doc_form status
});
```

---

### **3. Configure Paperform**

**Form 1: Therapy Documentation Sheet**
- Webhook URL: `https://your-domain.com/api/paperform-webhook/therapy-documentation`
- Prefill fields: client_name, client_id, booking_id, etc.

**Form 2: Free Consultation Notes**
- Webhook URL: `https://your-domain.com/api/paperform-webhook/free-consultation`
- Prefill fields: client_name, client_id, booking_id, etc.

---

## 📊 FUTURE ENHANCEMENTS (Optional)

### **If you need more granular session types:**

```sql
-- Add more specific types
ALTER TABLE client_doc_form 
ADD COLUMN therapy_type VARCHAR(50);

-- Populate from booking_resource_name
UPDATE client_doc_form cdf
SET therapy_type = CASE 
  WHEN b.booking_resource_name LIKE '%Individual%' THEN 'individual'
  WHEN b.booking_resource_name LIKE '%Couple%' THEN 'couple'
  WHEN b.booking_resource_name LIKE '%Adolescent%' THEN 'adolescent'
  WHEN b.booking_resource_name LIKE '%Family%' THEN 'family'
  WHEN b.booking_resource_name LIKE '%Group%' THEN 'group'
  ELSE 'other'
END
FROM bookings b
WHERE cdf.booking_id = b.booking_id
  AND cdf.session_type = 'paid_session';
```

---

## ✅ CHECKLIST

- [ ] Run migration script: `npx tsx scripts/addSessionTypeColumn.ts`
- [ ] Verify session_type distribution
- [ ] Check for NULL values
- [ ] Update backend code to set session_type for new records
- [ ] Create webhook endpoints
- [ ] Configure Paperform webhooks
- [ ] Test free consultation flow
- [ ] Test paid session flow
- [ ] Update documentation

---

## 🎯 READY TO PROCEED?

**The migration script is ready to run!**

**Should I proceed with:**
1. ✅ Running the migration script?
2. ✅ Creating the webhook endpoint implementations?
3. ✅ Creating the field mapping configuration?

**Please confirm to proceed!**
