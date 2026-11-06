# Vercel Deployment Guide

## Quick Deploy to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Property Portal Next.js"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/property-portal.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   In Vercel Dashboard → Project Settings → Environment Variables, add:
   
   ```
   NEXT_PUBLIC_BITRIX24_WEBHOOK = https://fusion.bitrix24.com/rest/38/ghgrjkyk1ybf8fd9/
   BITRIX24_DOMAIN = https://fusion.bitrix24.com
   BITRIX24_EMAIL = cy@fusioneta.com
   BITRIX24_PASSWORD = cyCheongPass123!
   PROGRESSIVE_BILLING_CATEGORY = 4
   BUYER_PASSWORD = testtest123
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at: `https://your-project.vercel.app`

---

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd property-portal-nextjs
   vercel
   ```

4. **Follow prompts**
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No
   - Project name: property-portal (or your choice)
   - Directory: ./
   - Override settings: No

5. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_BITRIX24_WEBHOOK
   # Paste: https://fusion.bitrix24.com/rest/38/ghgrjkyk1ybf8fd9/
   
   vercel env add BITRIX24_DOMAIN
   # Paste: https://fusion.bitrix24.com
   
   vercel env add BITRIX24_EMAIL
   # Paste: cy@fusioneta.com
   
   vercel env add BITRIX24_PASSWORD
   # Paste: cyCheongPass123!
   
   vercel env add PROGRESSIVE_BILLING_CATEGORY
   # Paste: 4
   
   vercel env add BUYER_PASSWORD
   # Paste: testtest123
   ```

6. **Redeploy with environment variables**
   ```bash
   vercel --prod
   ```

---

### Method 3: Vercel Dashboard Upload

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Go to Vercel Dashboard**
   - https://vercel.com/new

3. **Drag and drop the entire project folder**

4. **Add environment variables** (same as Method 1)

5. **Deploy**

---

## Custom Domain Setup

1. **Add domain in Vercel**
   - Project Settings → Domains
   - Add your domain (e.g., portal.fusioneta.com)

2. **Configure DNS**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or use Vercel nameservers

3. **SSL Certificate**
   - Vercel auto-provisions SSL via Let's Encrypt
   - Usually takes 30-60 seconds

---

## Environment Variables Security

### Production Settings

For production, consider:

1. **Use Vercel Secrets** (instead of plain text)
   ```bash
   vercel secrets add bitrix24-webhook "https://fusion.bitrix24.com/rest/38/ghgrjkyk1ybf8fd9/"
   vercel secrets add bitrix24-password "cyCheongPass123!"
   vercel secrets add buyer-password "testtest123"
   ```

2. **Update vercel.json** to reference secrets
   ```json
   {
     "env": {
       "NEXT_PUBLIC_BITRIX24_WEBHOOK": "@bitrix24-webhook",
       "BITRIX24_PASSWORD": "@bitrix24-password",
       "BUYER_PASSWORD": "@buyer-password"
     }
   }
   ```

3. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Verify units are loading
- [ ] Check milestone data
- [ ] Test image loading
- [ ] Verify navigation
- [ ] Test on mobile devices
- [ ] Check all tabs work
- [ ] Test photo modal
- [ ] Verify logout works
- [ ] Check session persistence
- [ ] Test access control

---

## Monitoring & Analytics

### Enable Vercel Analytics

```bash
npm i @vercel/analytics
```

Add to `src/app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Enable Vercel Speed Insights

```bash
npm i @vercel/speed-insights
```

Add to `src/app/layout.tsx`:
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## Troubleshooting Deployment

### Build Fails

**Check logs:**
```bash
vercel logs
```

**Common issues:**
- Missing environment variables
- TypeScript errors
- Build timeout (upgrade plan)

### Images Not Loading

**Solution:**
- Check `next.config.js` has correct image domains
- Verify API route is accessible: `https://your-app.vercel.app/api/image-proxy`

### Authentication Issues

**Solutions:**
- Verify environment variables are set
- Check cookies are enabled
- Ensure `NODE_ENV=production`

---

## Updating Deployment

### Automatic (with GitHub)
- Push to main branch
- Vercel auto-deploys

### Manual
```bash
vercel --prod
```

---

## Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Next.js Docs: https://nextjs.org/docs

---

**Your app is now live!** 🎉

Access at: `https://your-project.vercel.app`
