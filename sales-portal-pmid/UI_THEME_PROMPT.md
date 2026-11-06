# Sales Portal UI Theme - Quick Prompt Template

> Copy and paste this prompt to modify any existing app to match the Sales Portal UI theme.

---

## PROMPT

```
Please modify this application's UI to match our Sales Portal theme exactly. Here are the styling requirements:

## COLOR PALETTE
- **Page Background**: `bg-gray-50`
- **Cards**: `bg-white` with `border border-gray-100`
- **Primary Buttons**: `bg-gray-900 hover:bg-black` (NOT blue!)
- **Text Primary**: `text-gray-900`
- **Text Secondary**: `text-gray-500` or `text-gray-600`
- **Status Colors**:
  - Success/Active: `emerald-500`
  - Warning/Pending: `amber-500` or `orange-500`
  - Info/Available: `blue-500`
  - Error/Inactive: `rose-500`

## TYPOGRAPHY
- **Page Titles**: `text-4xl font-extrabold tracking-tight text-gray-900`
- **Section Headers**: `text-2xl font-bold text-gray-900`
- **Card Titles**: `text-lg font-bold text-gray-900`
- **Body Text**: `text-sm font-medium text-gray-600`
- **Labels**: `text-xs font-semibold uppercase tracking-wider text-gray-500`
- **Metrics/Numbers**: `text-3xl font-bold tracking-tight text-gray-900`

## COMPONENTS

**Cards:**
```jsx
<div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
```

**Primary Button:**
```jsx
<button className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black shadow-lg hover:shadow-xl transition-all">
```

**Secondary Button:**
```jsx
<button className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
```

**Input Field:**
```jsx
<input className="block w-full rounded-xl border-transparent bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 hover:bg-gray-100" />
```

**Tab (Active):**
```jsx
<button className="px-6 py-3 rounded-xl text-sm font-bold bg-gray-900 text-white shadow-md">
```

**Tab (Inactive):**
```jsx
<button className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">
```

## LAYOUT
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8`
- **Card Padding**: `p-6` or `p-8`
- **Section Spacing**: `mb-8`
- **Grid Gaps**: `gap-6` (cards) or `gap-4` (smaller items)

## BORDERS & SHADOWS
- **Border Radius**: `rounded-xl` (buttons/inputs), `rounded-2xl` (cards), `rounded-3xl` (modals)
- **Shadows**: `shadow-sm` (default cards), `shadow-lg` (buttons), `shadow-xl` (elevated cards)

## CRITICAL RULES
1. Use `bg-gray-900` for ALL primary actions (not blue)
2. Page background is ALWAYS `bg-gray-50`
3. Cards are ALWAYS `bg-white` with `border-gray-100`
4. Use `font-bold` or `font-extrabold` for headings and buttons
5. Border radius: xl/2xl/3xl only (never sm/md/lg)

Apply these styles throughout the entire application while maintaining existing functionality.
```

---

## USAGE

1. Copy the prompt above
2. Paste into your AI conversation
3. The AI will update all UI elements to match the Sales Portal theme
4. Review and iterate as needed

---

## QUICK REFERENCE

| Element | Class |
|---------|-------|
| Page BG | `bg-gray-50` |
| Card | `bg-white rounded-2xl p-6 border border-gray-100 shadow-sm` |
| Primary Button | `bg-gray-900 text-white rounded-xl px-6 py-2.5 font-bold` |
| Input | `rounded-xl bg-gray-50 px-4 py-3 focus:ring-1 focus:ring-gray-900` |
| H1 | `text-4xl font-extrabold text-gray-900` |
| H2 | `text-2xl font-bold text-gray-900` |
| Body | `text-sm font-medium text-gray-600` |
