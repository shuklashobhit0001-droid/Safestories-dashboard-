# Pre-Therapy Call Stage - Tags Removal Summary

## What Was Changed

In the **Pre-therapy Call** stage of the CRM pipeline, we **removed the automatic tagging** that was previously applied when a lead's consultation outcome was set to **"To be Followed up"**.

## Previous Behavior

When filling out the Pre-therapy Call form:
- If the consultation outcome was set to **"To be Followed up"**
- The system would automatically:
  1. Move the lead to the **Follow Ups** stage (`followup-1`)
  2. Add a tag **"to be followed up"** to the lead

## Current Behavior

Now when the consultation outcome is **"To be Followed up"**:
- The lead is still automatically moved to the **Follow Ups** stage (`followup-1`)
- **NO tag is added** to the lead
- The `tags` field remains empty/unchanged

## Code Changes

### Backend (server/index.ts)
**Lines 1257-1259:**
```typescript
} else if (consultation_outcome === 'To be followed up') {
  targetStage = 'followup-1';
  newTags = 'to be followed up';  // ← This line sets the tag
}
```

The tag assignment (`newTags = 'to be followed up'`) was **removed** so that leads moved to Follow Ups stage don't get automatically tagged.

### Frontend Display
The frontend still displays tags if they exist (in `PipelineContent.tsx`), but since the backend no longer sets them for "To be Followed up" outcomes, no tags will appear for these leads.

## Reason for Change

The automatic tagging was redundant because:
- The lead's stage already indicates it needs follow-up
- The `consultation_outcome` field in the database already stores "To be Followed up"
- The tag was creating visual clutter without adding meaningful information

## Related Files

1. **server/index.ts** (lines 1240-1280) - Backend logic for pre-therapy form submission
2. **src/crm/components/PreTherapyCallFormModal.tsx** - Form with consultation outcome options
3. **src/crm/components/PipelineContent.tsx** - Pipeline display showing tags (if present)

## Database Impact

- The `leads` table has a `tags` column that stores tag values
- Previously: Leads with "To be Followed up" outcome had `tags = 'to be followed up'`
- Now: Leads with "To be Followed up" outcome have `tags = NULL` or empty

## Note

Other consultation outcomes (Session booked, Referred, Closed) were never tagged and remain unchanged.
