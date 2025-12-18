# Keyboard Navigation Implementation Guide

## 🚀 Quick Start

Add keyboard navigation to any form in 3 simple steps:

### Step 1: Import the Hook

```typescript
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation'
```

### Step 2: Create a Form Ref

```typescript
const formRef = useRef<HTMLFormElement>(null)
```

### Step 3: Initialize the Hook

```typescript
useKeyboardNavigation({
  formRef,
  onSubmit: () => handleSubmit(), // Your submit function
  enableEnterToNextField: true,
  enableArrowNavigation: true,
})
```

### Step 4: Add Ref to Form Element

```typescript
<form ref={formRef} onSubmit={handleSubmit}>
  {/* Your form fields */}
</form>
```

---

## 📋 Complete Example

### Example: New Inquiry Dialog

```typescript
'use client'

import { useRef } from 'react'
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function NewInquiryDialog({ open, onOpenChange }) {
  const formRef = useRef<HTMLFormElement>(null)

  // Initialize keyboard navigation
  useKeyboardNavigation({
    formRef,
    onSubmit: () => form.handleSubmit(onSubmit)(),
    enableEnterToNextField: true,
    enableArrowNavigation: true,
  })

  const onSubmit = (data) => {
    // Handle form submission
    console.log('Form submitted:', data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form ref={formRef} onSubmit={onSubmit}>
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter full name"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number"
            />
          </div>

          {/* WhatsApp Checkbox */}
          <div>
            <Checkbox id="whatsapp" name="whatsapp" />
            <Label htmlFor="whatsapp">Has WhatsApp</Label>
          </div>

          {/* City Dropdown */}
          <div>
            <Label htmlFor="city">City</Label>
            <Select name="city">
              <option value="">Select city</option>
              <option value="colombo">Colombo</option>
              <option value="kandy">Kandy</option>
              <option value="galle">Galle</option>
            </Select>
          </div>

          {/* Preferred Status (Radio Buttons) */}
          <div>
            <Label>Preferred Status</Label>
            <div className="flex space-x-4">
              <input type="radio" name="status" value="1" id="status-1" />
              <label htmlFor="status-1">Not Interested</label>
              
              <input type="radio" name="status" value="5" id="status-5" />
              <label htmlFor="status-5">Interested</label>
              
              <input type="radio" name="status" value="10" id="status-10" />
              <label htmlFor="status-10">Very Interested</label>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit">
            Create Inquiry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🎹 Keyboard Shortcuts (Auto-enabled)

Once you add the hook, these shortcuts work automatically:

| Action | Keys |
|--------|------|
| Next field | `Tab` or `Enter` |
| Previous field | `Shift + Tab` |
| Navigate dropdown | `↑` `↓` |
| Navigate radio buttons | `←` `→` |
| Toggle checkbox | `Space` |
| Submit form | `⌘ Enter` (Mac) or `Ctrl Enter` (Windows) |

---

## 🎨 Add Visual Hints (Optional)

Show users that keyboard shortcuts are available:

```typescript
import { KeyboardHint } from '@/components/ui/keyboard-hint'

export function MyForm() {
  return (
    <>
      <form ref={formRef}>
        {/* Form fields */}
      </form>
      
      <KeyboardHint /> {/* Shows hints in bottom-right corner */}
    </>
  )
}
```

---

## ⚙️ Configuration Options

### Disable Enter to Move

If you want Enter to only submit (not move to next field):

```typescript
useKeyboardNavigation({
  formRef,
  enableEnterToNextField: false, // ← Disable Enter navigation
})
```

### Disable Arrow Navigation

If you want standard arrow key behavior:

```typescript
useKeyboardNavigation({
  formRef,
  enableArrowNavigation: false, // ← Disable arrow keys
})
```

### Custom Submit Handler

```typescript
useKeyboardNavigation({
  formRef,
  onSubmit: async () => {
    // Custom validation
    if (!isValid) {
      toast.error('Please fill required fields')
      return
    }
    
    // Submit
    await handleSubmit()
  },
})
```

---

## 🔧 Troubleshooting

### Issue: Keyboard shortcuts not working

**Solution:**
1. Make sure `formRef` is attached to the `<form>` element
2. Check that fields are not `disabled`
3. Verify fields have proper `name` or `id` attributes

### Issue: Enter submits instead of moving to next field

**Solution:**
- This is expected for textareas (allows new lines)
- For other fields, check `enableEnterToNextField` is `true`

### Issue: Can't navigate to a specific field

**Solution:**
- Check if field has `tabindex="-1"` (remove it)
- Make sure field is visible and not hidden

---

## 📁 Files Added

```
src/
  hooks/
    use-keyboard-navigation.ts     ← Main hook
  components/
    ui/
      keyboard-hint.tsx             ← Visual hints component
```

---

## 🎯 Forms to Update

Add keyboard navigation to these forms:

### High Priority
- ✅ New Inquiry Dialog
- [ ] Edit Inquiry Dialog
- [ ] Create User Dialog
- [ ] Edit User Dialog
- [ ] Create Task Dialog

### Medium Priority
- [ ] Create Program Dialog
- [ ] Create Campaign Dialog
- [ ] WhatsApp Campaign Form
- [ ] Settings Forms

### Low Priority
- [ ] Login Form
- [ ] Search Forms
- [ ] Filter Forms

---

## 📚 Additional Resources

- [Full Keyboard Navigation Guide](./KEYBOARD_NAVIGATION_GUIDE.md)
- [Accessibility Best Practices](#)
- [Form Design Guidelines](#)

---

## 🤝 Contributing

When creating new forms:

1. **Always** add the keyboard navigation hook
2. **Always** test with keyboard only (no mouse)
3. **Always** test on both Mac and Windows
4. Consider adding `<KeyboardHint />` for complex forms

---

## 💡 Tips

### For Developers
- Test forms with keyboard only before committing
- Add `tabindex` carefully (can break navigation)
- Use semantic HTML (`<button>`, `<select>`, etc.)

### For Users
- Learn the shortcuts - they're much faster!
- Use `⌘/?` to see all shortcuts anytime
- Report any navigation issues

---

## 🎉 Benefits

✅ **Faster data entry** - Keep hands on keyboard  
✅ **Better accessibility** - Screen reader friendly  
✅ **Professional UX** - Modern form interactions  
✅ **Reduced errors** - Smooth field transitions  
✅ **Power user friendly** - Advanced shortcuts  

---

**Happy coding with keyboard navigation!** ⌨️✨

