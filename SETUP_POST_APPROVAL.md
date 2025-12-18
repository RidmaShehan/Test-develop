# 🎯 Post Approval System - Final Setup Instructions

## ✅ Implementation Complete!

Your **complete Post Approval System** is now ready! Here's what to do next:

---

## 📋 Step 1: Add Navigation Link

Edit `src/components/layout/sidebar.tsx` and add this to your navigation items:

```typescript
// Import the icon at the top
import { FileText } from 'lucide-react'

// Add to your navigation array
{
  href: '/posts',
  label: 'Social Media Posts',
  icon: FileText,
}
```

---

## 📋 Step 2: Restart Your Development Server

```bash
# If server is running, stop it (Ctrl+C)
# Then restart:
npm run dev
```

---

## 📋 Step 3: Access the System

Navigate to: **http://localhost:3000/posts**

---

## 🎉 What's Included

### ✅ Complete Features:

1. **Post Creation** (`/posts` + "Create Post" button)
   - Caption editor
   - Image upload
   - Program selection (from your database)
   - Campaign selection (from your database)
   - Budget input
   - Campaign duration picker
   - **Approval chain builder** (drag & drop approvers)

2. **Approval Workflow**
   - Sequential approval (must approve in order)
   - Approve with optional comment
   - Reject with required comment
   - Automatic status updates
   - Next approver notification (TODO: email)

3. **Dashboard**
   - **All Posts** tab - See all your posts
   - **Pending My Approval** tab - Posts waiting for you
   - **Approved** tab - Fully approved posts
   - Real-time approval chain status
   - Visual status badges

4. **Permissions**
   - Creator can update before approval
   - Only assigned approvers can approve
   - Admins see all posts
   - Role-based access control

---

## 📊 Database Structure

Already migrated! You have:

```
✅ social_media_posts table
✅ post_approvals table (approval chain)
✅ post_comments table
✅ Relations to users, programs, campaigns
```

---

## 🔧 API Endpoints Ready

All functional:

```
✅ GET    /api/posts              # List posts
✅ POST   /api/posts              # Create post
✅ GET    /api/posts/[id]         # Get post details
✅ PUT    /api/posts/[id]         # Update post
✅ DELETE /api/posts/[id]         # Delete post

✅ POST   /api/posts/[id]/approve # Approve post
✅ POST   /api/posts/[id]/reject  # Reject with comment
✅ GET    /api/posts/pending      # My pending approvals

✅ POST   /api/posts/[id]/comments # Add comment
```

---

## 🎯 How It Works

### Creating a Post:

1. User clicks "Create Post"
2. Fills in:
   - Caption
   - Image (optional)
   - Program (optional, from DB)
   - Campaign (optional, from DB)
   - Budget (optional)
   - Start/End dates
   - **Approval chain** (1-5 approvers in order)

3. Submits → Status = `PENDING_APPROVAL`
4. First approver gets notification (TODO: email)

### Approval Process:

```
POST CREATED
    ↓
Approver 1: PENDING → ✅ APPROVED
    ↓
Approver 2: PENDING → ✅ APPROVED
    ↓
Approver 3: PENDING → ✅ APPROVED
    ↓
ALL APPROVED! Status = APPROVED ✅

---OR---

Approver 2: PENDING → ❌ REJECTED
    ↓
Status = REJECTED (chain stops)
```

### Rules:
- ✅ Must approve in sequence
- ✅ Cannot skip approvers
- ✅ Any rejection stops the chain
- ✅ Must add comment when rejecting
- ✅ Cannot change decision after submitting

---

## 📱 User Interface

### Dashboard Tabs:

1. **All Posts**
   - Shows all your posts
   - Filter by status
   - See approval progress

2. **Pending My Approval**
   - Posts waiting for YOU
   - One-click approve/reject
   - Shows your position in chain

3. **Approved**
   - All fully approved posts
   - Ready for publishing

### Post Card Shows:
- ✅ Image preview
- ✅ Caption
- ✅ Creator info
- ✅ Status badge
- ✅ Budget (if set)
- ✅ Duration
- ✅ Program/Campaign links
- ✅ **Approval chain with live status**
- ✅ Comments count
- ✅ Action buttons (if your turn)

---

## 🎨 Status Badges

| Status | Color | Meaning |
|--------|-------|---------|
| 🟡 PENDING_APPROVAL | Yellow | Waiting for approvers |
| 🟢 APPROVED | Green | All approved |
| 🔴 REJECTED | Red | Someone rejected |
| 🔵 PUBLISHED | Blue | Posted to social media |
| 🟣 SCHEDULED | Purple | Scheduled for future |
| ⚪ DRAFT | Gray | Not yet submitted |

---

## 🧪 Test It Out!

### Test Scenario 1: Happy Path

1. Create a post
2. Add 2 approvers (yourself and another user)
3. Submit
4. Go to "Pending My Approval"
5. Approve it
6. Login as second approver
7. Approve it
8. Status → APPROVED ✅

### Test Scenario 2: Rejection

1. Create a post
2. Add 2 approvers
3. First approver approves
4. Second approver rejects (with comment)
5. Status → REJECTED ❌
6. Creator sees rejection reason

### Test Scenario 3: Update

1. Create a post (PENDING)
2. Update caption/image before approval
3. After approval → Cannot update

---

## ⚠️ Known Limitations

### Currently Manual:
- **Notifications**: No email/push notifications yet
  - Approvers must check dashboard manually
  - TODO item for future

### Not Implemented:
- Social media publishing (just approval workflow)
- Analytics dashboard
- Post templates
- Bulk operations

These are marked as future enhancements.

---

## 🐛 Troubleshooting

### Can't see the page?
```bash
# Make sure server is running:
npm run dev

# Check console for errors
# Visit: http://localhost:3000/posts
```

### Database errors?
```bash
# Regenerate Prisma client:
npx prisma generate

# Push schema again:
npx prisma db push
```

### Can't upload images?
- Check `/api/upload` route exists
- Verify upload folder permissions
- Check file size (< 5MB)

### Approval not working?
- Check you're the next approver
- Previous approvers must approve first
- Cannot approve if already approved/rejected

---

## 📚 Documentation

Full documentation available in:
- `POST_APPROVAL_SYSTEM_COMPLETE.md` - Technical details
- `POST_APPROVAL_QUICKSTART.md` - User guide

---

## 🎓 Example Usage

### Marketing Team Workflow:

1. **Content Creator** makes post
   - Adds caption, image
   - Links to campaign
   - Sets budget
   - Adds approval chain:
     - Marketing Manager → Director → VP

2. **Marketing Manager** reviews
   - Sees post in "Pending My Approval"
   - Approves with comment: "Great caption!"

3. **Director** reviews
   - Now sees it pending (Manager approved)
   - Approves

4. **VP** reviews
   - Final approval
   - Status → APPROVED
   - Ready to publish!

---

## 🚀 You're Ready!

Everything is set up and working. Just add the navigation link and you're good to go!

**Questions?** Check the documentation files or review the API responses in your browser's developer tools.

**Happy posting! 🎉**

