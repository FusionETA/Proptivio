# Property Development Buyer Portal - Next.js Version

## 🎉 Complete Next.js Implementation

A modern property development buyer portal built with Next.js 14, TypeScript, and integrated with Bitrix24 CRM. Features construction milestone tracking with 4 internal stages per milestone, progress photos, and secure buyer access.

---

## ✅ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **Authentication**: Cookie-based sessions
- **API Integration**: Bitrix24 REST API
- **Deployment**: Vercel-ready

---

## 📂 Project Structure

```
property-portal-nextjs/
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   └── auth.ts              # Server actions for authentication
│   │   ├── api/
│   │   │   └── image-proxy/
│   │   │       └── route.ts         # Image proxy API route
│   │   ├── units/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx         # Unit details page
│   │   │   │   ├── UnitDetailsClient.tsx
│   │   │   │   ├── PhotoModal.tsx
│   │   │   │   ├── unit-details.module.css
│   │   │   │   └── photo-modal.module.css
│   │   │   ├── page.tsx             # Units listing page
│   │   │   └── units.module.css
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Login page
│   │   └── login.module.css
│   ├── lib/
│   │   ├── auth.ts                  # Authentication utilities
│   │   ├── bitrix24.ts              # Bitrix24 API client
│   │   ├── milestones.ts            # Milestone management
│   │   └── utils.ts                 # Utility functions
│   └── components/                  # Reusable components (future)
├── .env.local                       # Environment variables
├── next.config.js                   # Next.js configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
└── README.md
```

---

## 🚀 Getting Started

### **1. Installation**

```bash
# Clone or extract the project
cd property-portal-nextjs

# Install dependencies
npm install
```

### **2. Environment Configuration**

Edit `.env.local` with your Bitrix24 credentials:

```env
NEXT_PUBLIC_BITRIX24_WEBHOOK=https://fusion.bitrix24.com/rest/38/ghgrjkyk1ybf8fd9/
BITRIX24_DOMAIN=https://fusion.bitrix24.com
BITRIX24_EMAIL=cy@fusioneta.com
BITRIX24_PASSWORD=cyCheongPass123!
PROGRESSIVE_BILLING_CATEGORY=4
BUYER_PASSWORD=testtest123
```

### **3. Development**

```bash
# Run development server
npm run dev

# Open browser
http://localhost:3000
```

### **4. Production Build**

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🌐 Deployment to Vercel

### **Option 1: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### **Option 2: GitHub Integration**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables from `.env.local`
6. Deploy

### **Environment Variables in Vercel**

Add these in Project Settings → Environment Variables:

```
NEXT_PUBLIC_BITRIX24_WEBHOOK
BITRIX24_DOMAIN
BITRIX24_EMAIL
BITRIX24_PASSWORD
PROGRESSIVE_BILLING_CATEGORY
BUYER_PASSWORD
```

---

## 🎨 Features

### **1. Authentication System**
- Email-based login
- Secure cookie sessions (7-day expiry)
- Server-side session validation

### **2. Units Dashboard**
- View all units owned by buyer
- Tower/Block, Floor, Unit Number display
- Contract value display
- Real-time construction progress percentage
- Click to view detailed progress

### **3. Unit Details - Two Tabs**

#### **Tab 1: Construction Milestones**
- Timeline view of 8 milestones
- Status: Completed / In Progress / Not Started
- Expandable milestone details
- 4 Internal Stages: New, Verification, Billing, Close Deal
- Progress percentages
- Start/End dates
- Site photos per milestone

#### **Tab 2: Progress Photos Gallery**
- Photos from completed/in-progress milestones
- Grouped by milestone
- Click to view full-screen
- Keyboard navigation (←/→ arrows)

---

## 🏗️ Bitrix24 Structure

### **Category 4: Progressive Billing Pipeline**
Contains unit deals (e.g., Deal #18 = Unit B-2-7)

### **Category 6: Construction Milestones**
8 shared milestone deals:

```
Deal #20 → Site Clearing
Deal #24 → Piling Work
Deal #26 → Foundation Work
Deal #28 → Concrete Reinforcement
Deal #30 → Electrical Wiring & Plumbing
Deal #32 → Roofing
Deal #34 → Internal & External Plastering
Deal #36 → Roads & Drains
```

### **Internal Stages**
Each milestone progresses through:

```
C6:NEW → New
C6:PREPARATION → Verification
C6:PREPAYMENT_INVOICE → Billing
C6:WON → Success (Completed)
```

---

## 🔒 Security

- ✅ Server-side session management
- ✅ Cookie-based authentication (httpOnly, secure)
- ✅ Unit ownership verification
- ✅ XSS protection (React auto-escaping)
- ✅ Environment variable protection
- ✅ API route protection

---

## 🧪 Testing

**Test Login Credentials:**
- Email: laura@example.com (or any buyer email in Bitrix24)
- Password: testtest123

---

## 📊 API Structure

### **Server Actions**
- `loginAction()` - Handle user login
- `logoutAction()` - Handle user logout

### **API Routes**
- `GET /api/image-proxy` - Proxy authenticated Bitrix24 images

### **Library Functions**
- `bitrix24Request()` - Make API calls
- `getContactByEmail()` - Fetch contact by email
- `getUnitsForContact()` - Fetch units for contact
- `getAllMilestonesForUnit()` - Get all milestone data
- `calculateUnitCompletionPercentage()` - Calculate progress

---

## 🐛 Troubleshooting

**Milestones Not Showing:**
- Verify deal IDs in `lib/milestones.ts`
- Check Bitrix24 webhook URL
- Ensure Category IDs are correct

**Authentication Issues:**
- Clear browser cookies
- Check `.env.local` configuration
- Verify BUYER_PASSWORD

**Images Not Loading:**
- Check Bitrix24 file permissions
- Verify image proxy route is working
- Test: `/api/image-proxy?fileId=...&ownerId=...&fieldName=...`

---

## 🔄 Migration from PHP

**Key Changes:**
- PHP sessions → Next.js cookies
- Direct file access → API routes
- Server-side rendering → React Server Components
- Global functions → Module exports
- `.php` → `.tsx/.ts`

**Maintained Features:**
- All PHP functionality preserved
- Same UI/UX design
- Identical Bitrix24 integration
- Same authentication flow

---

## 📈 Future Enhancements

- [ ] Payment tracking integration
- [ ] Document management system
- [ ] Email notifications
- [ ] PDF report generation
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Real-time updates (WebSocket)
- [ ] Advanced analytics dashboard

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Update `.env.local` with production credentials
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS in Vercel
- [ ] Configure custom domain
- [ ] Set up error monitoring (Sentry)
- [ ] Enable Vercel Analytics
- [ ] Test all authentication flows
- [ ] Verify image loading
- [ ] Check responsive design
- [ ] Test on multiple browsers

---

## 📝 License

Proprietary - Built for Proptivio Property Buyers

---

## 👨‍💻 Developer

**Built for**: FusionETA  
**Version**: 2.0 (Next.js)  
**Last Updated**: January 2025

---

## 🆘 Support

For technical support or questions:
- Check Bitrix24 API documentation
- Review Next.js documentation
- Contact: cy@fusioneta.com

---

**Ready for Production Deployment** ✅
