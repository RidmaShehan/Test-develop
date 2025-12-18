# Keyboard Navigation Guide

## 🎹 Keyboard Shortcuts for Forms

This CRM system now supports comprehensive keyboard navigation for better accessibility and faster data entry.

---

## Basic Navigation

### Moving Between Fields

| Key Combination | Action |
|----------------|--------|
| `Tab` | Move to next field |
| `Shift + Tab` | Move to previous field |
| `Enter` | Move to next field (except in textarea) |

**Note:** In textareas, `Enter` creates a new line as expected.

---

## Dropdown/Select Fields

### Navigation

| Key | Action |
|-----|--------|
| `Arrow Down ↓` | Move to next option |
| `Arrow Up ↑` | Move to previous option |
| `Enter` | Confirm selection and move to next field |
| `Tab` | Close dropdown and move to next field |

### Usage Example:
1. Focus on a dropdown field
2. Use `↓` and `↑` to navigate options
3. Press `Enter` to select and move to next field

---

## Checkbox Fields

### Toggle Selection

| Key | Action |
|-----|--------|
| `Space` | Toggle checkbox (check/uncheck) |
| `Enter` | Toggle checkbox and move to next field |

### Usage Example:
1. Focus on a checkbox
2. Press `Space` to toggle on/off
3. Press `Tab` or `Enter` to move to next field

---

## Radio Buttons / Preferred Status

### Navigation

| Key | Action |
|-----|--------|
| `Arrow Right →` | Select next option |
| `Arrow Left ←` | Select previous option |
| `Arrow Down ↓` | Select next option (alternative) |
| `Arrow Up ↑` | Select previous option (alternative) |
| `Enter` | Confirm selection and move to next field |

### Usage Example:
1. Focus on a radio button group
2. Use `←` and `→` to navigate options
3. The option is automatically selected as you navigate
4. Press `Enter` to confirm and move to next field

---

## Form Submission

### Quick Submit

| Key Combination | Action |
|----------------|--------|
| `Cmd + Enter` (Mac) | Submit the form |
| `Ctrl + Enter` (Windows/Linux) | Submit the form |

**Note:** Works from any field in the form.

---

## Complete Workflow Example

### Creating a New Inquiry (with keyboard only):

```
1. Focus on "Full Name" field
2. Type the name
3. Press Enter → moves to Phone field
4. Type the phone number
5. Press Enter → moves to WhatsApp checkbox
6. Press Space → toggles WhatsApp on
7. Press Enter → moves to Email field
8. Type email address
9. Press Enter → moves to City dropdown
10. Press ↓ → navigate cities
11. Press Enter → selects city and moves to next field
12. Press Enter → moves to Age Band field
13. Use ↓ ↑ → select age range
14. Press Enter → moves to Preferred Status
15. Use ← → → select status option
16. Press Enter → confirms and moves to next field
17. Continue filling remaining fields...
18. Press Cmd/Ctrl + Enter → Submit form
```

---

## Accessibility Features

### Visual Indicators
- ✅ Focus rings show which field is active
- ✅ Selected dropdown options are highlighted
- ✅ Checked checkboxes have visual confirmation
- ✅ Selected radio buttons are clearly marked

### Screen Reader Support
- ✅ All fields have proper labels
- ✅ Required fields are announced
- ✅ Error messages are read aloud
- ✅ Form instructions are accessible

---

## Tips for Power Users

### Speed Data Entry
1. Keep hands on keyboard (no mouse needed)
2. Use `Enter` to quickly move through fields
3. Use `Cmd/Ctrl + Enter` to submit without reaching for mouse
4. Use arrow keys for quick dropdown selections

### Common Patterns
- **Text fields:** Type → `Enter`
- **Dropdowns:** `↓↓` → `Enter`
- **Checkboxes:** `Space` → `Enter`
- **Radio buttons:** `→→` → `Enter`
- **Submit:** `Cmd/Ctrl + Enter`

---

## Forms with Keyboard Navigation

The following forms support full keyboard navigation:

- ✅ Create New Inquiry
- ✅ Edit Inquiry
- ✅ Create New User
- ✅ Edit User
- ✅ Create New Role
- ✅ Edit Role
- ✅ Create Task/Follow-up
- ✅ Create Program
- ✅ Create Campaign
- ✅ WhatsApp Campaign
- ✅ Settings Forms

---

## Customization

### Disable Enter to Move
If you prefer `Enter` to NOT move to the next field:

```typescript
useKeyboardNavigation({
  formRef,
  enableEnterToNextField: false, // Disable Enter navigation
})
```

### Disable Arrow Navigation
If you prefer standard arrow key behavior:

```typescript
useKeyboardNavigation({
  formRef,
  enableArrowNavigation: false, // Disable arrow navigation
})
```

---

## Troubleshooting

### Issue: Enter doesn't move to next field
**Solution:** Make sure `enableEnterToNextField` is set to `true` (default)

### Issue: Arrow keys don't work in dropdowns
**Solution:** Ensure the dropdown has focus (press `Tab` to focus it first)

### Issue: Cmd/Ctrl + Enter doesn't submit
**Solution:** Make sure the form has a submit button or `onSubmit` handler

### Issue: Can't navigate to a specific field
**Solution:** Check if the field is disabled or has `tabindex="-1"`

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Tab Navigation | ✅ | ✅ | ✅ | ✅ |
| Enter to Move | ✅ | ✅ | ✅ | ✅ |
| Arrow Keys | ✅ | ✅ | ✅ | ✅ |
| Space Toggle | ✅ | ✅ | ✅ | ✅ |
| Cmd/Ctrl + Enter | ✅ | ✅ | ✅ | ✅ |

---

## Future Enhancements

### Planned Features:
- [ ] Escape to close dropdowns
- [ ] Home/End to jump to first/last field
- [ ] Cmd/Ctrl + K for quick search
- [ ] Customizable keyboard shortcuts
- [ ] Keyboard shortcut cheat sheet overlay (press `?`)

---

## Feedback

Having issues with keyboard navigation? Please report them to the development team with:
- Browser and version
- Operating system
- Specific form and field
- Steps to reproduce

---

**Enjoy faster data entry with keyboard navigation!** 🚀

