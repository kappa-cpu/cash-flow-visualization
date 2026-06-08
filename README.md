## 資産管理アプリ - Refactored

A progressive web app for Japanese personal finance management with 6-month cash flow projections.

### ✨ Recent Improvements

This refactored version addresses maintainability, robustness, and user experience:

#### **Code Organization**
- ✅ **Modular file structure**: HTML (`index.html`), CSS (`styles.css`), JavaScript (`app.js`) separated
- ✅ **Readable code**: Unminified JavaScript with clear section comments
- ✅ **Centralized configuration**: All magic numbers and strings in `CONFIG` and `SELECTORS` constants
- ✅ **Helper functions**: Utility functions for DOM manipulation (`$()`, `$$()`, `createElement()`)
- ✅ **Event listener architecture**: Replaced inline `onclick`/`oninput` handlers with proper `addEventListener`

#### **Robustness & Validation**
- ✅ **Input validation**: Days clamped to 1-31 range
- ✅ **Deletion confirmation**: Users must confirm before removing entries
- ✅ **Error handling**: Try-catch blocks for localStorage operations
- ✅ **Color-coded indicators**: Summary values show positive (green) or negative (red) states

#### **Accessibility Improvements**
- ✅ **ARIA labels**: Buttons and inputs have descriptive `aria-label` attributes
- ✅ **ARIA live regions**: Save indicator uses `role="status"` and `aria-live="polite"`
- ✅ **Semantic HTML**: Better structure for assistive technologies

#### **UX Enhancements**
- ✅ **Confirmation dialogs**: Prevent accidental data loss
- ✅ **Better feedback**: Visual indicators for balance status (negative balance highlighted)
- ✅ **Improved responsiveness**: Consistent debouncing for updates

### 📁 File Structure

```
.
├── index.html          # Clean HTML structure
├── styles.css          # Formatted, maintainable CSS
├── app.js              # ~800 lines of organized JavaScript
└── README.md           # This file
```

### 🚀 Features

- **Balance Tracking**: Track current balance with real-time updates
- **Income Sources**: Add multiple job income streams with monthly amounts and payday
- **Recurring Expenses**: Manage credit card payments with custom dates
- **One-time Transactions**: Log individual income/expenses with dates
- **6-Month Projection**: Visual chart showing balance trends
- **Persistent Storage**: Data saved to localStorage automatically
- **Dark Mode Support**: Respects system color scheme preference
- **Mobile Optimized**: Responsive design for phones and tablets

### 💾 Local Storage Format

Data is saved under key `at-v1` in the following format:

```json
{
  "balance": 500000,
  "jobs": [
    {
      "name": "アルバイト先",
      "day": 25,
      "months": { "2026-6": 100000, "2026-7": 100000 }
    }
  ],
  "cards": [
    {
      "name": "クレカ",
      "day": 10,
      "months": { "2026-6": 50000, "2026-7": 50000 }
    }
  ],
  "transactions": [
    {
      "dateStr": "2026-06-15",
      "type": "expense",
      "label": "その他支出",
      "amount": 5000
    }
  ]
}
```

### 🔧 Configuration

Edit the `CONFIG` object in `app.js` to customize:

```javascript
const CONFIG = {
  DAYS: 180,                        // Projection period
  STORAGE_KEY: 'at-v1',            // localStorage key
  DEFAULT_JOB_DAY: 25,             // Default payday
  DEFAULT_CARD_DAY: 10,            // Default payment day
  UPDATE_DEBOUNCE_MS: 150,         // Debounce delay
  SAVED_FLASH_DURATION_MS: 2000,   // Save indicator duration
};
```

### 📋 Future Enhancements

- [ ] Export data as JSON/CSV
- [ ] Import data from file
- [ ] Undo/redo functionality
- [ ] Budget alerts (e.g., when balance falls below threshold)
- [ ] Transaction categories
- [ ] Monthly spending breakdown
- [ ] Multi-user support
- [ ] Cloud sync

### 🛠 Development Notes

**Keyboard Navigation**: 
- Tab through inputs and buttons naturally
- Confirm dialogs with Enter, cancel with Escape

**Browser Compatibility**:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage support
- Uses ES6+ syntax

**Performance**:
- Debounced updates prevent excessive recalculations
- Chart is destroyed and recreated (not updated) for clarity
- Efficient DOM queries using cached selectors

### 📱 Mobile Considerations

- Responsive layout adapts below 540px width
- Touch-friendly buttons and spacing
- Full-screen PWA support with app icon and title
- Optimized for iPhone home screen installation

### 🐛 Known Limitations

- Chart rendering uses destroy/recreate (performance acceptable for 6 months)
- No transaction categorization yet
- Mobile keyboard may obscure bottom content
- No offline support (needs service worker)

---

**Version**: 2.0 (Refactored)  
**Last Updated**: 2026-06-08
