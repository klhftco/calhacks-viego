# Viego Wallet - Quick Deployment Guide

## Cal Hacks 12.0 Demo Setup

### 🚀 Quick Start (5 minutes)

1. **Deploy to Vercel**:
   ```bash
   # Via GitHub (Recommended)
   1. Push code to GitHub
   2. Connect repository at vercel.com
   3. Click "Deploy"

   # OR via CLI
   npm install -g vercel
   vercel --prod
   ```

2. **Configure Environment Variables** in Vercel Dashboard:
   ```
   VISA_USER_ID=<your_visa_user_id>
   VISA_PASSWORD=<your_visa_password>
   VISA_API_URL=https://sandbox.api.visa.com
   VISA_CERT=<base64_encoded_cert>
   VISA_KEY=<base64_encoded_key>
   VISA_CA_BUNDLE=<base64_encoded_ca>
   NEXT_PUBLIC_API_URL=https://your-app.vercel.app
   ```

3. **Initialize Demo Data** (one-time):
   ```bash
   curl -X POST https://your-app.vercel.app/api/demo/init
   ```

4. **Test the App**:
   - Visit `https://your-app.vercel.app`
   - Login as Bailey or Oliver
   - Explore the budget dashboard

### 👥 Demo Users

**Bailey Chen** (bailey-student-001)
- Card: `4514170000000001`
- Controls: Alcohol ❌ | Gambling ❌ | Groceries $200/mo

**Oliver Martinez** (oliver-student-002)
- Card: `4514170000000002`
- Controls: Electronics $150/mo | Apparel $125/mo | Adult Ent. $100/mo

### 📱 Demo Flow

1. **Login Page** (`/login`) - Select Bailey or Oliver
2. **Island** (`/island`) - Interactive gamified experience
3. **Budget** (`/budget`) - View spending dashboard with VCTC data
4. **Payments** (`/payments`) - Manage automated payments
5. **Account** (`/account`) - User profile

### 🔧 Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Visa credentials

# Run development server
npm run dev

# Initialize demo data locally
npx tsx scripts/setup-demo-users.ts
```

### 📋 Key Features

- ✅ **Visa Transaction Controls (VCTC)** integration
- ✅ **mTLS authentication** with Visa sandbox
- ✅ **Real-time spending limits** enforcement
- ✅ **Transaction simulation** for testing
- ✅ **Multi-user demo** with distinct personas
- ✅ **Gamified financial education** via island interface

### 🛠️ Troubleshooting

**Build fails on Vercel?**
- Check environment variables are set
- Ensure certificates are base64 encoded
- Verify Next.js version compatibility

**Demo data not loading?**
- Run `/api/demo/init` endpoint
- Check Vercel function logs
- Verify Visa API credentials

**Authentication issues?**
- Clear browser localStorage
- Re-login from `/login` page
- Check console for errors

### 📚 Full Documentation

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for comprehensive deployment guide.

### 🏆 Cal Hacks Presentation Tips

1. **Start at login page** - Show both user personas
2. **Login as Bailey** - Demonstrate blocked transactions (alcohol/gambling)
3. **Show budget dashboard** - Real VCTC spending data
4. **Simulate transaction** - Live demo of merchant control enforcement
5. **Switch to Oliver** - Different spending patterns and limits
6. **Highlight island** - Gamification aspect

### 🔗 Important URLs

- Demo: `https://your-app.vercel.app`
- VCTC Docs: https://developer.visa.com/capabilities/vctc
- Visa Sandbox: https://sandbox.api.visa.com

---

**Built for Cal Hacks 12.0** 🎓💳
