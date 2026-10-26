# CLIENT INPUTS PENDING & DEPENDENCY MATRIX
**Document:** `docs/CLIENT_INPUTS_PENDING.md`  
**Reference Document:** `Premium_Fruits_Nuts_Ecommerce_Proposal.pdf` (Section 13: Client Inputs Required)  
**Project:** M/S Fruits & Nuts E-Commerce Platform

---

## Overview

In accordance with Section 13 of the project proposal, this document catalogs the exact external assets, credentials, and business parameters that require client provision.

> [!IMPORTANT]
> **Developer Engineering Continues:** Development and testing of developer-owned modules (e.g. SEO, JSON-LD, sitemaps, missing informational pages, and admin customer tools) **will not stop** while waiting for these client inputs. Mock fixtures, environment templates, and placeholder adapters remain active for local verification.

---

## 1. Live Payment Gateway Credentials

- **Required Item:** Razorpay Live Merchant Account Keys
- **Proposal Reference:** Section 5 (Payment Functionality) & Section 13 (Client Inputs)
- **Specific Credentials Needed:**
  1. `RAZORPAY_KEY_ID` (Live Key: e.g. `rzp_live_...`)
  2. `RAZORPAY_KEY_SECRET` (Live Secret)
  3. `RAZORPAY_WEBHOOK_SECRET` (Configured in Razorpay Webhook settings)
- **Current State in Code:** Test/Mock adapter configured and verified in `src/lib/payment/adapters/razorpay.adapter.ts`.
- **Impact if Delayed:** Online payments remain in test mode; real payment capture is deferred until deployment.

---

## 2. Production Database & Cloud Hosting

- **Required Item:** Production PostgreSQL Database & Hosting Platform Access
- **Proposal Reference:** Section 6 (Architecture) & Section 10 (Deployment)
- **Specific Details Needed:**
  1. **`DATABASE_URL`:** Pooled connection string with SSL (e.g. Supabase port 6543 / PgBouncer: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&sslmode=require`) for application serverless runtime traffic.
  2. **`DIRECT_URL`:** Direct connection string with SSL (port 5432: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`) for Prisma schema migrations and DDL locks.
  3. Production deployment target credentials (e.g. Vercel team invite or AWS credentials).
- **Current State in Code:** Prisma schema and baseline migration (`20261007000000_init`) are fully verified and ready.
- **Impact if Delayed:** Local and staging environments function normally; final live database deployment and persistence is deferred until credentials are provided.

---

## 3. Production Domain & DNS Routing

- **Required Item:** DNS Records for `www.fruitsandnuts.co.in`
- **Proposal Reference:** Section 10 (Domain Connection Assistance)
- **Specific Details Needed:**
  1. DNS access to point A/CNAME records to the hosting platform.
- **Current State in Code:** Canonical metadata base set to `https://www.fruitsandnuts.co.in`.
- **Impact if Delayed:** Staging URLs used until DNS cutover.

---

## 4. Legal & Regulatory Entity Details

- **Required Item:** Tax & Food Safety Licensing Numbers
- **Proposal Reference:** Section 13 (GST/tax details and invoice requirements)
- **Specific Details Needed:**
  1. Official FSSAI License Number (to replace placeholder in footer and food safety policy).
  2. Corporate GSTIN Number and legal company name for automated tax invoice generation.
- **Current State in Code:** Standard 5% dry fruits GST arithmetic enforced in checkout and order invoices.
- **Impact if Delayed:** Invoices show default store identifiers.

---

## 5. Official Customer Support Contact Information

- **Required Item:** Verified Concierge & Store Contact Details
- **Proposal Reference:** Section 2 (Contact page) & Section 13 (Business contact details)
- **Specific Details Needed:**
  1. Dedicated Customer Support Email (e.g. `support@fruitsandnuts.co.in`).
  2. WhatsApp / Phone Concierge Hotline number.
  3. Physical headquarters address for official correspondence.
- **Current State in Code:** Announcement bar currently uses the provided contact `+91-8368301495`.
- **Impact if Delayed:** Current verified contact number remains active.

---

## 6. Transactional Email & Password Reset Production Credentials

- **Required Item:** Authorized Transactional Email Provider Credentials & Verified Sender Domain
- **Proposal Reference:** Section 5 (Customer Accounts & Authentication) & Section 13 (Client Inputs)
- **Specific Items Needed from Client:**
  1. **Approved Sender Email Address:**
     - Verified mailbox representing the brand (e.g., `orders@fruitsandnuts.co.in` or `concierge@fruitsandnuts.co.in`).
     - Configuration variable: `EMAIL_FROM_ADDRESS` (or `SMTP_FROM`).
  2. **Email Provider API Key OR Corporate SMTP Credentials:**
     - **Option A (REST Provider — Recommended):**
       - `EMAIL_PROVIDER="RESEND"` (or `"SENDGRID"` / `"POSTMARK"`)
       - `EMAIL_PROVIDER_API_KEY`: Live production secret key (e.g. `re_...`)
     - **Option B (Corporate SMTP):**
       - `EMAIL_PROVIDER="SMTP"`
       - `SMTP_HOST`: e.g. `smtp.fruitsandnuts.co.in` or `smtp.gmail.com`
       - `SMTP_PORT`: `587` (STARTTLS) or `465` (SSL)
       - `SMTP_USER`: Mailbox login username
       - `SMTP_PASS`: Mailbox password or App Password
       - `SMTP_SECURE`: `"false"` for 587, `"true"` for 465
  3. **Verified Sender Domain & DNS Records (`fruitsandnuts.co.in`):**
     - Add SPF, DKIM, and DMARC TXT records generated in the provider's domain settings to your DNS provider (e.g. Cloudflare, GoDaddy, AWS Route 53).
     - **SPF Record:** `v=spf1 include:... ~all`
     - **DKIM Records:** Provided by transactional email provider
     - **DMARC Record:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@fruitsandnuts.co.in; pct=100`
  4. **Final Production Website URL:**
     - Configuration variable: `NEXT_PUBLIC_APP_URL="https://fruitsandnuts.co.in"`
     - Required to construct valid, non-tamperable HTTPS reset links in email messages.
- **Current State in Code:**
  - Password reset backend, token storage (SHA-256 hashed, 15-minute TTL, single-use invalidation), rate limiting, bcrypt hashing, and UI are 100% complete, verified, and passing 44 tests.
  - In the absence of live credentials, outbound email dispatch is safely marked as **BLOCKED BY CONFIGURATION**.
  - Rate limiting (5 req / 300s) and anti-enumeration generic responses are active.
- **Secure Setup Instructions:**
  - Configure these environment variables in your hosting environment's secret settings (e.g., Vercel / AWS Amplify / VPS `.env.production`).
  - **NEVER** share live API keys or SMTP passwords in chat.
  - **NEVER** commit secret keys to Git repository version control.
  - **NEVER** prefix transactional email secrets with `NEXT_PUBLIC_`.
- **Impact if Delayed:**
  - The website, registration, login, and password-reset interface operate without interruption.
  - Outbound email delivery remains dormant until genuine provider credentials are provided.


