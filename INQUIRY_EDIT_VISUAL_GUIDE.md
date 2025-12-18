# Inquiry Edit Feature - Visual Guide

## 📸 What You'll See

### 1. **Inquiries Table - Action Row (Desktop)**

```
┌────────────────────────────────────────────────────────────────┐
│ Name      Phone        Email           Stage        Actions    │
├────────────────────────────────────────────────────────────────┤
│ John Doe  0771234567  john@email.com  New    👁️ ✏️ 📞 💬 ✉️   │
│                                              ^                 │
│                                              │                 │
│                                         NEW EDIT BUTTON        │
└────────────────────────────────────────────────────────────────┘
```

**Button Details:**
- Icon: ✏️ Pencil (amber/orange color)
- Position: Between View (👁️) and Call (📞) buttons
- Hover: Amber background (hover:bg-amber-50)
- Tooltip: "Edit Inquiry"
- Permission: Only visible if user has `UPDATE_SEEKER` permission

---

### 2. **Inquiries Table - Mobile Card View**

```
┌──────────────────────────────────────────────┐
│  John Doe                    👁️ ✏️ 📞 💬 ✉️  │
│  0771234567                       ^          │
│  john@email.com              NEW EDIT BUTTON │
│                                              │
│  Age: 25          City: Colombo             │
│  Stage: New       Source: Facebook          │
└──────────────────────────────────────────────┘
```

---

### 3. **Edit Dialog - Desktop View (4 Column Grid)**

```
┌─────────────────────────── Edit Inquiry ────────────────────────────┐
│                                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Full Name * │ │ Phone *     │ │ WhatsApp    │ │ ☑ Has       │  │
│  │ John Doe    │ │ 0771234567  │ │ 0771234567  │ │   WhatsApp  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ Email       │ │ District    │ │ Age         │ │ Guardian    │  │
│  │ john@...    │ │ Colombo ▼   │ │ 25          │ │ 0771234567  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                      │
│  ┌─────────────┐                                                    │
│  │ Stage       │                                                    │
│  │ New ▼       │                                                    │
│  └─────────────┘                                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Preferred Programs                                 ×         │  │
│  │ Computer Science  BSc Honours — Main Campus                  │  │
│  │ [Search programs...]                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Marketing Source *                                           │  │
│  │ 📱 Facebook                                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Campaign (Optional)                                          │  │
│  │ Spring Enrollment Campaign 2024                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Preferred Status for Programs                                │  │
│  │ ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐                                       │  │
│  │ │█│█│█│█│█│█│█│ │ │ │  7/10                                 │  │
│  │ └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘                                       │  │
│  │ Click on a number to set your preferred status level (1-10)  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Description                                                  │  │
│  │ Interested in computer science program...                   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│                                           [Cancel] [Update Inquiry] │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 4. **Edit Dialog - Tablet View (2-3 Column Grid)**

```
┌───────────────── Edit Inquiry ─────────────────┐
│                                                 │
│  ┌──────────────┐ ┌──────────────┐            │
│  │ Full Name *  │ │ Phone *      │            │
│  │ John Doe     │ │ 0771234567   │            │
│  └──────────────┘ └──────────────┘            │
│                                                 │
│  ┌──────────────┐ ┌──────────────┐            │
│  │ WhatsApp     │ │ ☑ Has        │            │
│  │ 0771234567   │ │   WhatsApp   │            │
│  └──────────────┘ └──────────────┘            │
│                                                 │
│  ┌──────────────┐ ┌──────────────┐            │
│  │ Email        │ │ District     │            │
│  │ john@...     │ │ Colombo ▼    │            │
│  └──────────────┘ └──────────────┘            │
│                                                 │
│  ... (rest of fields)                          │
│                                                 │
│              [Cancel] [Update Inquiry]         │
└─────────────────────────────────────────────────┘
```

---

### 5. **Edit Dialog - Mobile View (Single Column)**

```
┌────── Edit Inquiry ──────┐
│                          │
│  ┌────────────────────┐  │
│  │ Full Name *        │  │
│  │ John Doe           │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Phone *            │  │
│  │ 0771234567         │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ WhatsApp           │  │
│  │ 0771234567         │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ ☑ Has WhatsApp     │  │
│  └────────────────────┘  │
│                          │
│  ... (all fields)        │
│                          │
│  ┌────────────────────┐  │
│  │  Update Inquiry    │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │     Cancel         │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

---

## 🎨 Color Scheme

### Edit Button
- **Default**: Transparent
- **Hover**: Amber/Orange background (`bg-amber-50`)
- **Icon**: Amber color on hover (`text-amber-600`)
- **Border**: None (ghost variant)

### Dialog
- **Background**: White
- **Border**: Light gray (`border-gray-200`)
- **Title**: Dark gray (`text-gray-900`)
- **Labels**: Medium gray (`text-gray-700`)
- **Inputs**: White with gray border
- **Focus**: Blue ring (`ring-primary`)

### Status Bar
- **Unfilled**: Light gray (`bg-gray-200`)
- **Filled**: Gradient from Red → Yellow → Green
  - 1-5: Red to Yellow
  - 6-10: Yellow to Green

---

## 🔄 User Flow

### Opening Edit Dialog
```
1. User clicks ✏️ Edit button in action row
   ↓
2. Dialog opens (smooth fade-in animation)
   ↓
3. Form fields auto-populate with current inquiry data
   ↓
4. User can see all existing values and start editing
```

### Editing Process
```
1. User modifies any field(s)
   ↓
2. Real-time validation (errors show immediately)
   ↓
3. Update button enables only when form is valid
   ↓
4. User clicks "Update Inquiry"
   ↓
5. Loading spinner shows on button
   ↓
6. Success: Toast notification + Dialog closes + List refreshes
   OR
   Error: Toast notification with error message + Dialog stays open
```

### Smart Features
```
District Field:
- Type to search → Shows filtered districts
- Arrow keys to navigate
- Enter to select
- Escape to close dropdown

Program Field:
- Type to search → Shows matching programs
- Click to add → Creates chip/badge
- Click X on chip → Removes program
- Can select multiple programs

WhatsApp Checkbox:
- Check "Has WhatsApp" → Auto-copies phone to WhatsApp field
- Uncheck → WhatsApp field stays as is (user can clear manually)

Marketing Source:
- Select source → Campaigns load automatically
- Shows campaign type icon and color
- Campaigns filtered to only active ones
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Move to next field (when in input) |
| `Enter` | Submit form (when on submit button) |
| `Esc` | Close dialog |
| `Tab` | Navigate between fields |
| `Shift + Tab` | Navigate backwards |
| `↑/↓` | Navigate dropdowns |
| `Space` | Toggle checkboxes |

---

## 📱 Responsive Breakpoints

| Screen Size | Grid Columns | Example Devices |
|-------------|--------------|-----------------|
| < 640px | 1 column | Mobile phones |
| 640px - 1024px | 2 columns | Tablets, small laptops |
| 1024px - 1280px | 3 columns | Laptops |
| > 1280px | 4 columns | Desktop monitors |

---

## ✅ Validation Messages

### Required Fields
- ❌ "Full name is required"
- ❌ "Phone number is required"
- ❌ "Marketing source is required"

### Format Validation
- ❌ "Full name must be at least 2 characters"
- ❌ "Full name can only contain letters and spaces"
- ❌ "Phone number must be at least 10 digits"
- ❌ "Phone number can only contain numbers, +, -, spaces, and parentheses"
- ❌ "Please enter a valid email address"
- ❌ "Age must be between 1 and 120"

### Length Validation
- ❌ "Full name must be less than 100 characters"
- ❌ "Phone number must be less than 15 digits"
- ❌ "Description must be less than 1000 characters"

---

## 🎯 Permission Logic

```typescript
// User WITH UPDATE_SEEKER permission
[👁️ View] [✏️ Edit] [📞 Call] [💬 WhatsApp] [✉️ Email]
  ↑          ↑
  Always   Visible
  visible

// User WITHOUT UPDATE_SEEKER permission
[👁️ View] [📞 Call] [💬 WhatsApp] [✉️ Email]
  ↑
  Always visible   (No edit button shown)
```

---

## 🎭 Loading States

### Button States
```
Normal:     [Update Inquiry]
Loading:    [⟳ Updating...]  (spinner + disabled)
Disabled:   [Update Inquiry]  (grayed out + cursor not-allowed)
```

### Dialog States
```
Opening:    Fade in animation
Closing:    Fade out animation
Loading:    Spinner on submit button only (form stays interactive)
Error:      Red error messages below invalid fields
Success:    Dialog closes + toast notification
```

---

## 💡 User Experience Details

### Auto-focus
- First field (Full Name) auto-focuses when dialog opens
- Easy to start typing immediately

### Smart Defaults
- All fields pre-filled with existing values
- Date/time fields show empty for new follow-ups
- Checkboxes reflect current state

### Visual Feedback
- Hover effects on all interactive elements
- Active field has blue border/ring
- Invalid fields have red border + error message
- Valid submission turns button primary color

### Accessibility
- All inputs have labels
- Error messages linked to inputs (ARIA)
- Keyboard navigation fully supported
- Focus visible indicators
- Screen reader friendly

---

## 🔍 What Changed in Code

### New File Created
```
src/components/inquiries/edit-inquiry-dialog.tsx
```

### Modified File
```
src/components/inquiries/inquiries-table.tsx
```

### Lines Added
- Import Pencil icon
- Import EditInquiryDialog component
- Import usePermissions hook
- Add editingInquiry state
- Add edit button in desktop table (with permission check)
- Add edit button in mobile card (with permission check)
- Add EditInquiryDialog component usage
- Add onSuccess callback to refresh list

---

## 📊 Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| View Inquiry | ✅ | ✅ |
| Create Inquiry | ✅ | ✅ |
| **Edit Inquiry** | ❌ | ✅ ✨ |
| Delete Inquiry | ❌ | ❌ |
| Export Inquiry | ❌ | ❌ |

---

## 🚀 How to Use

### For Admin Users (with UPDATE_SEEKER permission):
1. Go to Inquiries page
2. Find the inquiry you want to edit
3. Click the **✏️ Edit** button (amber/orange pencil icon)
4. Edit any fields you want to update
5. Click **Update Inquiry** button
6. See success message and updated inquiry in the list

### For Regular Users (without UPDATE_SEEKER permission):
- Edit button will not appear
- Can only view inquiries
- Cannot modify inquiry data

---

## 🎉 Benefits

✅ **Efficiency**: Edit inquiries without navigating to separate pages  
✅ **Accuracy**: Update information as it changes  
✅ **User-Friendly**: Clean, intuitive interface  
✅ **Mobile-Ready**: Works perfectly on all devices  
✅ **Secure**: Permission-based access control  
✅ **Fast**: Instant updates with optimistic UI  
✅ **Professional**: Modern, polished design  
✅ **Accessible**: Keyboard navigation and screen reader support  

---

## 📞 Need Help?

If the edit button doesn't appear:
1. Check if your user has `UPDATE_SEEKER` permission
2. Contact your system administrator to request access
3. Verify you're logged in with the correct account

If you encounter errors:
1. Check that all required fields are filled
2. Verify phone numbers and email are in correct format
3. Try refreshing the page
4. Contact support if issues persist

