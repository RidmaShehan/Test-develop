# Campaigns Access in Inquiry Form - Fix

## Overview
Updated the campaigns API and inquiry forms to allow all authenticated users (regardless of role) to fetch and view all ACTIVE campaigns when creating or editing inquiries.

**Date:** December 2024

---

## Problem
When creating or editing inquiries, users could only see campaigns they created themselves. This limited their ability to associate inquiries with campaigns created by other users (e.g., admins or other team members).

---

## Solution

### 1. ✅ Updated Campaigns API Route
**File:** `src/app/api/campaigns/route.ts`

**Changes:**
- Added `forInquiry=true` query parameter support
- When `forInquiry=true` is used, all authenticated users can see all ACTIVE campaigns
- This allows any user to select any active campaign when creating/editing inquiries
- For other contexts (without `forInquiry`), role-based filtering still applies

**Key Code:**
```typescript
// Get query parameters
const forInquiry = searchParams.get('forInquiry') === 'true'

// If fetching for inquiry form, allow all users to see all ACTIVE campaigns
if (forInquiry) {
  where.status = 'ACTIVE'
  // No role-based filtering - all users see all active campaigns
} else {
  // For other contexts: apply role-based filtering
  if (!isAdminRole(user.role)) {
    where.createdById = user.id
  }
}
```

### 2. ✅ Updated New Inquiry Dialog
**File:** `src/components/inquiries/new-inquiry-dialog.tsx`

**Changes:**
- Updated `fetchCampaignsByType()` to include `forInquiry=true` parameter
- Now all users can see all ACTIVE campaigns when selecting a campaign

**Before:**
```typescript
const response = await fetch(`/api/campaigns?type=${campaignType}&limit=100`)
```

**After:**
```typescript
const response = await fetch(`/api/campaigns?type=${campaignType}&limit=100&forInquiry=true`)
```

### 3. ✅ Updated Edit Inquiry Dialog
**File:** `src/components/inquiries/edit-inquiry-dialog.tsx`

**Changes:**
- Updated `fetchCampaignsByType()` to include `forInquiry=true` parameter
- Consistent behavior with new inquiry form

---

## Access Control Summary

### Campaigns API (`/api/campaigns`)

#### Normal Usage (without `forInquiry`):
- ✅ **Normal Users:** See only campaigns they created
- ✅ **Admin/Administrator/Developer:** See all campaigns
- ✅ **Purpose:** Campaign management, viewing own campaigns

#### Inquiry Form Usage (with `forInquiry=true`):
- ✅ **All Authenticated Users:** See all ACTIVE campaigns
- ✅ **No role restrictions** - any user can select any active campaign
- ✅ **Purpose:** Allow users to associate inquiries with any active campaign

---

## Behavior

### When Creating/Editing Inquiries:
1. User selects a **Marketing Source** (Campaign Type)
2. System fetches campaigns with `forInquiry=true`
3. **All users** see **all ACTIVE campaigns** of that type
4. User can select any active campaign to associate with the inquiry

### When Managing Campaigns (Campaigns Page):
1. Normal users see only their own campaigns
2. Admin users see all campaigns
3. Role-based filtering applies as before

---

## Testing Checklist

### As Normal User:
- [ ] Open "Add New Inquiry" form
- [ ] Select a marketing source (campaign type)
- [ ] Campaign dropdown should show **all ACTIVE campaigns** of that type (not just your own)
- [ ] Can select any active campaign
- [ ] Edit inquiry form should also show all active campaigns

### As Admin/Administrator/Developer:
- [ ] Open "Add New Inquiry" form
- [ ] Select a marketing source (campaign type)
- [ ] Campaign dropdown should show **all ACTIVE campaigns** of that type
- [ ] Can select any active campaign
- [ ] Campaigns management page still shows all campaigns (as before)

---

## Files Modified

1. `src/app/api/campaigns/route.ts`
   - Added `forInquiry` query parameter support
   - Allow all users to see all ACTIVE campaigns when `forInquiry=true`

2. `src/components/inquiries/new-inquiry-dialog.tsx`
   - Updated `fetchCampaignsByType()` to use `forInquiry=true`

3. `src/components/inquiries/edit-inquiry-dialog.tsx`
   - Updated `fetchCampaignsByType()` to use `forInquiry=true`

---

## Summary

✅ **All authenticated users** can now:
- See and select **all ACTIVE campaigns** when creating/editing inquiries
- Associate inquiries with any active campaign (not just their own)
- Access campaigns regardless of role or permissions in the inquiry form context

✅ **Role-based filtering** still applies:
- In campaigns management pages
- When fetching campaigns for other purposes (without `forInquiry` parameter)

The inquiry form now provides full access to all active campaigns for all users! 🎉

