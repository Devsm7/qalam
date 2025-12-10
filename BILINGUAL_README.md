# Qalam - Bilingual Website

## Language Switching Feature

This website now supports both **English** and **Arabic** languages with seamless switching.

### Features:

1. **Language Toggle Button**: Located in the navigation bar with a globe icon
2. **RTL Support**: Automatic right-to-left layout when Arabic is selected
3. **Persistent Language**: Your language preference is saved in browser localStorage
4. **Smooth Transitions**: All text changes smoothly when switching languages

### How It Works:

- **Click the language button** in the navigation (shows "عربي" for Arabic or "English" for English)
- The page will instantly switch to the selected language
- The layout will automatically adjust for RTL (Arabic) or LTR (English)
- Your choice is remembered for future visits

### Technical Implementation:

- **HTML**: All translatable content has `data-i18n` attributes
- **JavaScript**: `main.js` contains all translations and switching logic
- **CSS**: `style.css` includes RTL-specific styles for Arabic
- **Storage**: Language preference stored in `localStorage`

### Files Modified:

1. `index.html` - Added data-i18n attributes and language toggle button
2. `main.js` - Added translation data and language switching functionality
3. `style.css` - Added language button styles and RTL support
4. `translations.js` - Standalone translations file (optional reference)

### Supported Languages:

- **English (en)** - Default language
- **Arabic (ar)** - Full RTL support

### Browser Compatibility:

Works on all modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- localStorage API

---

**Developed for Qalam - Bridging Arabic Calligraphy and Technology**
