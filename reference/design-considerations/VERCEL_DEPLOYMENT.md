# Vercel Deployment Guide - Viego Wallet

## Pre-Deployment Checklist

### 1. Environment Variables Required

Create these environment variables in Vercel Dashboard:

```bash
# Visa API Credentials
VISA_USER_ID=your_visa_user_id
VISA_PASSWORD=your_visa_password

# Visa API URLs
VISA_API_URL=https://sandbox.api.visa.com
NEXT_PUBLIC_API_URL=https://your-app.vercel.app

# Visa mTLS Certificates (Base64 encoded)
VISA_CERT=your_base64_encoded_cert
VISA_KEY=your_base64_encoded_key
VISA_CA_BUNDLE=your_base64_encoded_ca_bundle

# Optional: Demo mode flag
DEMO_MODE=true
```

### 2. Certificate Preparation

**Important**: Vercel requires certificates in base64 format for environment variables.

```bash
# Encode certificates to base64
base64 -i path/to/cert.pem > cert_base64.txt
base64 -i path/to/key_private.pem > key_base64.txt
base64 -i path/to/ca_bundle.pem > ca_base64.txt

# Copy contents to Vercel environment variables
```

### 3. Next.js Configuration

The app is already configured for Vercel deployment. Key configurations:

**`next.config.ts`** (already set):
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

## Deployment Steps

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd viego-wallet
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project settings:
     - Framework Preset: **Next.js**
     - Root Directory: **viego-wallet**
     - Build Command: `npm run build` (default)
     - Output Directory: `.next` (default)

3. **Add Environment Variables**:
   - In Vercel Dashboard → Settings → Environment Variables
   - Add all variables from section 1 above
   - Make sure to add them to **Production**, **Preview**, and **Development** environments

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)

## Post-Deployment Setup

### 1. Initialize Demo Data

After first deployment, run the demo initialization:

```bash
# Call the init endpoint (one-time setup)
curl -X POST https://your-app.vercel.app/api/demo/init
```

**OR** create a manual script:

```bash
# Run setup script
cd viego-wallet
npx tsx scripts/setup-demo-users.ts
```

### 2. Test the Deployment

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Should redirect to `/login`
3. Select Bailey or Oliver
4. Navigate through:
   - `/island` - Interactive gamified experience
   - `/budget` - Budget dashboard with VCTC data
   - `/payments` - Payment management
   - `/account` - User profile

### 3. Verify VCTC Integration

Test the VCTC API endpoints:

```bash
# Check if certificates are working
curl https://your-app.vercel.app/api/vctc/alerts?userIdentifier=bailey-student-001

# Simulate a transaction
curl -X POST https://your-app.vercel.app/api/vctc/decision \
  -H "Content-Type: application/json" \
  -d '{
    "primaryAccountNumber": "4514170000000001",
    "amount": 50,
    "merchantName": "Test Store",
    "merchantCategoryCode": "5411"
  }'
```

## Troubleshooting

### Certificate Issues

If you get SSL/TLS errors:

1. **Verify base64 encoding**:
   ```bash
   echo $VISA_CERT | base64 -d | openssl x509 -text -noout
   ```

2. **Check certificate format**:
   - Certificates should be in PEM format
   - Should start with `-----BEGIN CERTIFICATE-----`
   - Should be single-line base64 when stored in env vars

3. **Update lib/vctc-client.ts** if needed to decode from base64:
   ```typescript
   const cert = Buffer.from(process.env.VISA_CERT!, 'base64').toString('utf-8');
   const key = Buffer.from(process.env.VISA_KEY!, 'base64').toString('utf-8');
   ```

### Build Errors

Common issues:

1. **TypeScript errors**:
   ```bash
   # Run type check locally first
   npm run build
   ```

2. **Missing dependencies**:
   ```bash
   # Ensure all deps are in package.json
   npm install
   ```

3. **Environment variable access**:
   - Server-side: Use `process.env.VARIABLE_NAME`
   - Client-side: Must prefix with `NEXT_PUBLIC_`

### Runtime Errors

1. **404 on API routes**:
   - Check that API routes are in `app/api/` directory
   - Verify route.ts files export proper HTTP methods (GET, POST, etc.)

2. **CORS issues**:
   - Not typically needed for Next.js API routes
   - If calling external APIs, ensure proper headers

3. **Demo data not loading**:
   - Run `/api/demo/init` endpoint manually
   - Check Vercel Function Logs for errors

## Performance Optimization

### 1. Enable ISR (Incremental Static Regeneration)

For pages that don't change often:

```typescript
// app/island/page.tsx
export const revalidate = 3600; // Revalidate every hour
```

### 2. Optimize Images

Already using Next.js Image component:

```tsx
import Image from "next/image";
<Image src="/monster.png" width={200} height={200} alt="Monster" />
```

### 3. API Route Caching

Add cache headers to frequently accessed endpoints:

```typescript
// app/api/vctc/alerts/route.ts
export async function GET(request: Request) {
  const data = await getAlerts();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
```

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard:
- Go to your project → Analytics
- Enable Web Analytics & Speed Insights

### Error Tracking

View logs in Vercel Dashboard:
- Project → Functions
- Click on any function to see logs
- Filter by status code (4xx, 5xx)

### Custom Logging

Add structured logging:

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Transaction processed',
  userId: 'bailey-student-001',
  amount: 50
}));
```

## Security Best Practices

1. **Never commit sensitive data**:
   - `.env.local` is gitignored
   - Certificates only in Vercel env vars

2. **Use environment-specific variables**:
   - Production: Real Visa credentials
   - Preview: Sandbox credentials
   - Development: Local sandbox

3. **Validate all inputs**:
   - Already implemented in API routes
   - Add rate limiting if needed:
     ```typescript
     import { rateLimit } from '@/lib/rate-limit';

     export async function POST(request: Request) {
       const ip = request.headers.get('x-forwarded-for');
       const { success } = await rateLimit.check(ip);

       if (!success) {
         return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
       }

       // Handle request...
     }
     ```

## Demo Mode Considerations

For Cal Hacks demo:

1. **Pre-populate data**: Run `/api/demo/init` before demo
2. **Mock fallbacks**: Mock data is already in place for budget page
3. **Clear instructions**: Login page explains demo users
4. **Reset capability**: Can call init endpoint again to reset

## Rollback Strategy

If deployment fails:

```bash
# Via CLI
vercel rollback

# Via Dashboard
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "⋯" → "Promote to Production"
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Visa Developer Portal](https://developer.visa.com)
- [VCTC API Reference](https://developer.visa.com/capabilities/vctc)

## Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] Certificates properly base64 encoded
- [ ] GitHub repository connected (if using Git integration)
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript errors resolved
- [ ] Demo initialization endpoint called
- [ ] All pages load correctly
- [ ] VCTC API endpoints responding
- [ ] Login flow working for both users
- [ ] Budget page showing correct user data
- [ ] Navigation working across all pages
- [ ] Mobile responsiveness verified
- [ ] Analytics enabled (optional)

---

**Deployment URL**: `https://your-project.vercel.app`

**Expected Build Time**: 2-5 minutes

**First Deployment**: ~5-10 minutes (includes demo data initialization)
