# M/S Fruits & Nuts — Luxury E-Commerce Platform

Welcome to the **Fruits & Nuts** Next.js 15 luxury artisanal dried fruits, nuts, berries, and gourmet gifting web application.

---

## 1. Prerequisites & System Compatibility

- **Operating System:** Windows 10/11, macOS, or Linux
- **Node.js Version:** `v20.x`, `v22.x` (LTS recommended), or `v24.x`
- **Package Manager:** `npm` (v10+ or v11+)
- **Terminal:** Visual Studio Code PowerShell (or any standard shell)

> **Important Note for Windows Users on Node 22/24:**  
> When installing dependencies on Windows with modern Node versions, ensure Node uses your Windows System Certificate Store so Prisma binary downloads complete smoothly:
> ```powershell
> $env:NODE_OPTIONS = "--use-system-ca"
> ```

---

## 2. Quick Start Guide (VS Code PowerShell)

Follow these exact steps to run the application locally on your Windows laptop:

### Step 1: Open Terminal in Project Root
Open the extracted project folder in Visual Studio Code, press `Ctrl + ~` to open the integrated PowerShell terminal, and verify your path:
```powershell
Get-Location
```

### Step 2: Initialize Local Environment Configuration
Copy the safe configuration template to `.env.local`:
```powershell
Copy-Item .env.example .env.local
```

### Step 3: Set Node Environment Variable & Install Dependencies
Run the following in PowerShell:
```powershell
$env:NODE_OPTIONS = "--use-system-ca"
npm install
```

### Step 4: Generate Prisma Client Types
Generate the Prisma Client and schema types:
```powershell
npm run prisma:generate
```

### Step 5: (Optional) Run Automated Tests & Type-Check
Verify that TypeScript and automated test suites pass:
```powershell
npm run type-check
npm run test:catalog
npm run test:all
```

### Step 6: Start the Development Server
Launch the Next.js development server:
```powershell
npm run dev
```

Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## 3. Available NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Start development server on port 3000 |
| `build` | `next build` | Create optimized production build (93 routes) |
| `start` | `next start` | Run production server |
| `type-check` | `tsc --noEmit` | Validate TypeScript types |
| `prisma:generate` | `prisma generate` | Generate Prisma client and TypeScript models |
| `prisma:migrate` | `prisma migrate dev` | Apply migrations to local PostgreSQL database |
| `prisma:deploy` | `prisma migrate deploy`| Apply migrations to production database |
| `prisma:seed` | `tsx src/database/seed.ts`| Seed database with default categories and products |
| `test:all` | `tsx src/test/run-all.ts`| Run all 28 automated test suites |

---

## 4. Production Credentials & Database Setup

The project is built with offline catalog and sommelier fallbacks, allowing the storefront and AI features to operate locally even without an active PostgreSQL instance.

When ready to connect live production services, update `.env.local` (or configure your hosting provider's environment variables) with:

1. **PostgreSQL Database:**
   - `DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"`
   - `DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"`
   - Run migrations: `npm run prisma:deploy`
   - Seed catalog: `npm run prisma:seed`
2. **Payment Gateway (Razorpay):**
   - `PAYMENT_PROVIDER="RAZORPAY"`
   - `RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"`
   - `RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"`
   - `RAZORPAY_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"`
3. **Session Authentication:**
   - `AUTH_SECRET="<generate 32-byte hex key with openssl rand -hex 32>"`
4. **Logistics & Notifications:**
   - Configure Shiprocket / Delhivery and Resend / SendGrid / SMTP credentials as documented in `.env.example` and `docs/CLIENT_INPUTS_PENDING.md`.

---

## 5. Handover Documentation Reference

Detailed architecture and operations manuals are available in the [`docs/`](./docs) folder:
- **`docs/DEPLOYMENT_GUIDE.md`**: Step-by-step production deployment procedures.
- **`docs/ADMIN_HANDOVER_GUIDE.md`**: Guide to admin panels, product catalog, orders, and coupons.
- **`docs/CLIENT_INPUTS_PENDING.md`**: Register of client credentials needed for go-live.
