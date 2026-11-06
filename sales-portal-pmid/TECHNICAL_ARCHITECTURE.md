# Technical Architecture Guide

## 1. System Overview
 This project is a web application built using **Next.js (App Router)**. It serves as an Agent-Sales Portal, likely integrating with external systems like Bitrix24 for CRM/booking data.

**Key Technologies:**
- **Framework:** Next.js
- **Styling:** Tailwind CSS (configured in `tailwind.config.js` and `src/app/globals.css`)
- **Backend/API:** Next.js API Routes

## 2. File Structure
Here is an overview of the key directories and files:

```
/
├── src/
│   ├── app/                 # Main application routes and pages
│   │   ├── api/             # Backend API routes
│   │   ├── layout.js        # Root layout (HTML shell)
│   │   └── page.js          # Main homepage/dashboard
│   ├── components/          # Reusable UI components
│   │   ├── BookingForm.jsx  # Form for booking inquiries
│   │   ├── UnitCard.jsx     # Display card for individual property units
│   │   └── UnitGrid.jsx     # Grid layout for showing multiple units
│   └── lib/                 # Core logic and helper functions
│       ├── bitrix24.js      # Bitrix24 integration logic
│       └── fieldMapping.js  # Data mapping definitions
├── .env.local               # Environment variables (API keys, secrets)
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json             # Project dependencies and scripts
```

## 3. Frontend Architecture
The frontend is component-based.

*   **Entry Point:** `src/app/page.js` is the main page rendered when users visit the site.
*   **Layout:** `src/app/layout.js` defines the common structure (like `<html>`, `<body>`) wrapped around all pages.
*   **Components:** Located in `src/components/`.
    *   Go to `BookingForm.jsx` to modify the booking input fields or validation.
    *   Go to `UnitCard.jsx` or `UnitGrid.jsx` to change how property units are displayed.
*   **Styling:** Global styles are in `src/app/globals.css`. Component-specific styling is largely handled via Tailwind classes within the `.jsx` files.

## 4. Backend Services & APIs
The application has its own internal API layer to communicate with external services (Bitrix24).

*   **API Routes:** Located in `src/app/api/`. These run on the server.
    *   `/api/booking`: Handles booking submissions.
    *   `/api/units`: Fetches unit availabilities.
    *   `/api/deal-fields`: Manages deal-related metadata.
*   **Integration Logic:** The heavy lifting for communicating with Bitrix24 is in `src/lib/bitrix24.js`. This is where the actual HTTP requests to the CRM happen.

## 5. Troubleshooting & Modification Guide

### Where should I go if...?

| Goal | Path to Check |
|------|---------------|
| **I want to change the color/layout of the main page.** | `src/app/page.js` or `src/app/globals.css` |
| **I need to add a new input field to the booking form.** | `src/components/BookingForm.jsx` |
| **The Bitrix24 integration is failing or needs a new endpoint.** | `src/lib/bitrix24.js` |
| **I want to inspect how data is saved or fetched.** | Check the specific route in `src/app/api/` |
| **Authentication or API keys are wrong.** | `.env.local` (Note: This file is not committed to Git) |

### How to Run Locally
1.  Ensure dependencies are installed: `npm install`
2.  Start the development server: `npm run dev`
3.  Access the site at: `http://localhost:3000`
