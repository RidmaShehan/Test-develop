# Global Keyboard Shortcuts Guide

## 🚀 Quick Create: New Inquiry

### The Shortcut

Press **`⌘ Enter`** (Mac) or **`Ctrl Enter`** (Windows) **from anywhere** in the Inquiries page to instantly open the "Create New Inquiry" dialog!

---

## ✨ How It Works

### Before (Manual Way):
1. Navigate to Inquiries page
2. Move mouse to "Add New Inquiry" button
3. Click the button
4. Wait for dialog to open

### After (Keyboard Shortcut):
1. Press `⌘ Enter` / `Ctrl Enter`
2. Done! Dialog opens instantly ⚡

---

## 📍 Where It Works

| Page | Shortcut | Action |
|------|----------|--------|
| **Inquiries** | `⌘/Ctrl + Enter` | Open "Create New Inquiry" dialog |

---

## 💡 Visual Indicators

### 1. Button Tooltip
Hover over the "Add New Inquiry" button to see the keyboard shortcut hint: `⌘↵`

### 2. Page Subtitle
The inquiries page shows: "Press `⌘↵` or `Ctrl↵` to create new inquiry"

---

## 🎯 Complete Workflow Example

### Creating an Inquiry (100% Keyboard):

```
1. Navigate to Inquiries page
   
2. Press ⌘/Ctrl + Enter
   → New Inquiry dialog opens
   
3. Type full name
   
4. Press Enter
   → Moves to phone field
   
5. Type phone number
   
6. Press Enter
   → Moves to WhatsApp checkbox
   
7. Press Space
   → Toggles WhatsApp on/off
   
8. Continue filling fields...
   
9. Press ⌘/Ctrl + Enter
   → Submits the form
   
✅ Inquiry created without touching the mouse!
```

---

## ⚙️ Technical Details

### How the Shortcut Works

The shortcut uses a **global listener** that:
- ✅ Works anywhere on the page
- ✅ Doesn't interfere with typing in input fields
- ✅ Only opens dialog if it's not already open
- ✅ Prevents duplicate dialogs

### Smart Detection

The system knows when **NOT** to trigger:
- ❌ When you're typing in a text field (normal Enter works)
- ❌ When the dialog is already open
- ❌ When you're in a different page

---

## 🔮 Future Global Shortcuts

### Coming Soon:

| Shortcut | Action | Status |
|----------|--------|--------|
| `⌘/Ctrl + K` | Quick search | 🔄 Planned |
| `⌘/Ctrl + N` | New inquiry (alternative) | 🔄 Planned |
| `⌘/Ctrl + /` | Show all shortcuts | 🔄 Planned |
| `Esc` | Close dialog | ✅ Already works |
| `⌘/Ctrl + S` | Quick save | 🔄 Planned |

---

## 🛠️ For Developers

### Adding Global Shortcuts to Other Pages

```typescript
import { useModifierKey } from '@/hooks/use-global-shortcuts'

export function MyPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Add global shortcut
  useModifierKey('Enter', () => {
    if (!dialogOpen) {
      setDialogOpen(true)
    }
  }, {
    description: 'Create new item'
  })

  return (
    // Your page content
  )
}
```

### Available Hooks

```typescript
// 1. Generic modifier key (Cmd on Mac, Ctrl on Windows)
useModifierKey('n', callback)

// 2. Specific key combination
useGlobalShortcut({
  key: 'k',
  ctrl: true,
  shift: true,
  callback: () => console.log('Ctrl+Shift+K pressed')
})

// 3. Submit shortcut
useSubmitShortcut(callback)

// 4. New inquiry shortcut
useNewInquiryShortcut(callback)
```

---

## 🎨 UI Best Practices

### Show Shortcuts to Users

1. **In Button Tooltips**
   ```tsx
   <Button title="Create new (⌘/Ctrl + Enter)">
     Add New
   </Button>
   ```

2. **In Page Headers**
   ```tsx
   <p className="text-sm">
     Press <kbd>⌘↵</kbd> to create
   </p>
   ```

3. **On Hover**
   ```tsx
   <Button className="group">
     Add New
     <kbd className="hidden group-hover:inline">⌘↵</kbd>
   </Button>
   ```

---

## 🐛 Troubleshooting

### Issue: Shortcut not working

**Possible causes:**
1. You're on the wrong page (shortcut only works on Inquiries page)
2. Dialog is already open
3. Browser extension is intercepting the shortcut

**Solution:**
- Refresh the page
- Close any open dialogs
- Try the shortcut again

### Issue: Shortcut fires twice

**Cause:** Multiple instances of the component mounted

**Solution:** 
- This is prevented by checking if dialog is already open
- If issue persists, check for duplicate imports

---

## 📊 Comparison

### Time Saved Per Inquiry

| Method | Time | Steps |
|--------|------|-------|
| **Mouse Only** | ~3 seconds | 3 steps |
| **With Shortcuts** | ~0.5 seconds | 1 step |
| **Savings** | **83% faster** ⚡ | **67% fewer steps** |

**For 100 inquiries per day:**
- Mouse: 5 minutes wasted
- Keyboard: 50 seconds
- **You save 4+ minutes per day!**

---

## 💪 Pro Tips

1. **Muscle Memory**
   - Practice the shortcut 10 times
   - It becomes second nature

2. **Combine Shortcuts**
   ```
   ⌘/Ctrl + Enter (open dialog)
   → Fill fields with Tab/Enter
   → ⌘/Ctrl + Enter (submit)
   ```

3. **Speed Record**
   - Try to create an inquiry in under 30 seconds
   - Use only keyboard shortcuts
   - Beat your personal best!

---

## 🎓 Learning Path

### Beginner
- Learn: `⌘/Ctrl + Enter` to open dialog
- Learn: `Tab` to move between fields
- Learn: `Enter` to submit

### Intermediate  
- Learn: Arrow keys for dropdowns
- Learn: `Space` for checkboxes
- Learn: `Shift + Tab` to go back

### Advanced
- Combine all shortcuts
- Create inquiry without mouse
- Under 30 seconds consistently

---

## 📝 Feedback

Having issues with global shortcuts? Want more shortcuts?

**Report here:**
- File: `GLOBAL_SHORTCUTS_GUIDE.md`
- Feature request: Add to development board
- Bug report: Contact dev team

---

## 🎉 Benefits Summary

✅ **Instant Access** - No mouse clicking  
✅ **Time Saving** - 83% faster than mouse  
✅ **Professional** - Like modern apps (Linear, Notion)  
✅ **Muscle Memory** - Natural after practice  
✅ **Productivity** - Create more inquiries per day  

---

**Start using `⌘/Ctrl + Enter` now!** Open the Inquiries page and try it! 🚀

