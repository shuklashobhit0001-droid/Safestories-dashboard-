# Leads Multi-Select Delete Feature

## Summary
Added multi-select checkbox functionality with bulk delete capability to the Leads section in the CRM.

## Changes Made

### 1. Frontend - LeadsContent.tsx

#### New State Variables
- `selectedLeads`: Set<string> - Tracks which leads are selected via checkboxes
- `showDeleteConfirm`: boolean - Controls the delete confirmation modal visibility
- `deleting`: boolean - Tracks deletion in progress state

#### New Functions
- `handleSelectAll()` - Selects/deselects all visible leads in the current view
- `handleSelectLead(leadId)` - Toggles selection for individual lead
- `handleDeleteSelected()` - Performs bulk deletion of selected leads

#### UI Changes
1. **Checkbox Column**: Added a new column with checkboxes in the table
   - Header checkbox for "select all"
   - Individual checkbox for each lead row
   - Styled with teal accent color (#0f766e)

2. **Delete Button**: Appears when leads are selected
   - Shows count of selected leads
   - Red styling to indicate destructive action
   - Positioned next to the Export Excel button

3. **Delete Confirmation Modal**: 
   - Warning icon with red background
   - Shows count of leads to be deleted
   - Lists lead names (up to 5) for confirmation
   - Cancel and Delete buttons
   - Loading state during deletion
   - Click outside to close (when not deleting)

### 2. Backend - server/index.ts

#### New Endpoint
```typescript
DELETE /api/leads/:id
```

**Purpose**: Delete a single lead by ID

**Parameters**:
- `id` (URL param): Lead ID to delete

**Response**:
- Success (200): `{ success: true, message: 'Lead deleted successfully' }`
- Not Found (404): `{ error: 'Lead not found' }`
- Error (500): `{ error: 'Failed to delete lead' }`

**Logic**:
1. Checks if lead exists
2. Deletes the lead from database
3. Returns success/error response

## User Flow

1. User navigates to **Leads** section in CRM
2. User sees checkboxes next to each lead
3. User selects one or more leads by clicking checkboxes
4. **Delete (X)** button appears showing count of selected leads
5. User clicks Delete button
6. Confirmation modal appears with:
   - Warning message
   - List of leads to be deleted (if ≤5)
   - Cancel and Delete buttons
7. User confirms deletion
8. System deletes all selected leads
9. Leads list refreshes automatically
10. Selection is cleared

## Features

✅ **Multi-select**: Select multiple leads at once
✅ **Select All**: Checkbox in header to select all visible leads
✅ **Visual Feedback**: Selected count shown on delete button
✅ **Confirmation Modal**: Prevents accidental deletion
✅ **Lead Preview**: Shows which leads will be deleted (up to 5)
✅ **Loading State**: Shows spinner during deletion
✅ **Auto-refresh**: Leads list updates after deletion
✅ **Error Handling**: Graceful error messages if deletion fails

## Technical Details

### Frontend
- Uses React Set for efficient selection tracking
- Bulk deletion via Promise.all for parallel API calls
- Modal prevents interaction during deletion
- Automatic list refresh after successful deletion

### Backend
- Simple DELETE endpoint with existence check
- Returns appropriate HTTP status codes
- Error logging for debugging

## Use Cases

1. **Remove Duplicate Leads**: Easily delete duplicate entries
2. **Clean Test Data**: Remove test leads in bulk
3. **Archive Old Leads**: Delete outdated or irrelevant leads
4. **Data Cleanup**: Maintain clean CRM database

## Safety Features

- ⚠️ Confirmation modal prevents accidental deletion
- ⚠️ Shows lead details before deletion
- ⚠️ Disabled buttons during deletion process
- ⚠️ Clear visual indicators (red color, warning icon)

## Related Changes

This feature complements the earlier duplicate detection script (`check_duplicate_leads.ts`) which identified:
- 2 duplicate phone numbers in the database
- Ability to now easily clean up these duplicates

## Files Modified

1. `src/crm/components/LeadsContent.tsx` - Added multi-select and delete UI
2. `server/index.ts` - Added DELETE /api/leads/:id endpoint
