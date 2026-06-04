# Budget Aligned to Your Tech Stack & Sri Lankan Market Research

This document ties **your repository’s actual technology** to a **budget calculated from public Sri Lankan / regional market signals** (hourly bands, typical web-app ranges) and a **transparent effort estimate** suitable for a local software company using **existing code and facilities**.

| Field | Value |
|---|---|
| Currency | LKR (Sri Lankan Rupees) |
| FX note (planning) | Use **1 USD ≈ LKR 300–320** for 2025–2026 mental math where USD rates are cited |
| Last updated | 2026-03-25 |

---

## 1. Your technology stack (from this project)

Taken from `package.json` and typical Next.js patterns in this repo.

| Layer | Technology | Budget relevance |
|---|---|---|
| **Runtime** | Node.js (Next.js) | Standard SL talent pool; moderate rates |
| **Framework** | **Next.js 15.5.x** (App Router) | Full-stack; one team can own UI + API |
| **Language** | **TypeScript 5** | Slightly higher skill expectation vs JS-only |
| **UI** | **React 18**, **Tailwind CSS 4**, Radix UI | Modern stack; good contractor availability |
| **Forms / validation** | React Hook Form, **Zod** | Faster delivery; fewer edge-case bugs |
| **Data** | **Prisma 6.16**, `@prisma/client`, **PostgreSQL** (`pg`) | Strong typing; migration discipline needed |
| **Auth** | JWT (`jose` / `jsonwebtoken`), bcrypt | Security review line in budget |
| **Exports** | **xlsx**, **jspdf**, jspdf-autotable | Report/export modules are billable feature work |
| **Charts** | Recharts | Dashboard/reporting effort |
| **Drag & drop** | @dnd-kit | Kanban/tasks UX |
| **Cloud / files** | **AWS S3** SDK, presigner | Infra + security configuration |
| **Optional backends** | Supabase client, Upstash Redis | If used in prod, adds integration/testing |
| **Email / push** | Nodemailer, web-push | Operational features; third-party costs extra |
| **Deploy ecosystem** | Vercel analytics/speed (optional) | Hosting choice affects monthly OPEX |

**Implication:** This is a **full-stack TypeScript + Next + Prisma** product—not a simple marketing site. Sri Lankan quotes for “custom web app” that only cover **LKR 200k–2M** usually assume **small scope**; a **multi-module CRM with RBAC, reports, exports, and integrations** sits in a **higher band**, consistent with the **person-month** method below.

---

## 2. Sri Lankan market signals (sources)

Use these as **public benchmarks**, not a single vendor quote.

### 2.1 Developer hourly rates (international / regional listings)

Offshore-style bands often quoted for **Sri Lanka** (USD/hour):

| Level | Typical USD/hour (range) | Indicative LKR/hour @ 310 LKR/USD |
|---|---:|---:|
| Junior | ~8–15 | ~2,500 – 4,650 |
| Mid | ~15–30 | ~4,650 – 9,300 |
| Senior | ~30–45 | ~9,300 – 13,950 |

**Sources (external):**

- [SlashDev – Hiring Developers from Sri Lanka (hourly bands)](https://slashdev.io/blog/hiring-developers-from-sri-lanka-a-brief-overview)  
- [Lemon.io – Sri Lanka rate calculator / market pages](https://lemon.io/rate-calculator/sri-lanka/)  
- [PayScale – Software Development hourly (LK)](https://www.payscale.com/research/LK/Industry=Software_Development/Hourly_Rate) (use as **local salary signal**, not agency sell rate)

**Important:** A **Sri Lankan software company** will usually charge **above** raw salary equivalents because of overheads (PM, QA, office, risk, warranty, profit). So **project pricing** is often expressed as **blended LKR/hour** or **fixed milestones**.

### 2.2 “Custom web application” price headlines (Sri Lanka)

Blog/market pages often cite very wide ranges (simple sites vs real products):

- [Web-dev.lk – Web development price / pricing guides (Sri Lanka)](https://www.web-dev.lk/web-development-price-sri-lanka)  
- [SafeNet Creations – Website cost Sri Lanka (ranges)](https://www.safenetcreations.com/blog/website-cost-sri-lanka-2026-pricing-guide/)

These ranges **overlap** with small business websites. **Your CRM is closer to enterprise web app** (auth, RBAC, DB, reporting, exports)—so treat those low ends as **not comparable** for full CRM delivery.

---

## 3. How we calculate your budget (transparent method)

We use two checks that should roughly agree:

1. **Person-month estimate** (typical SL delivery team)  
2. **Blended hourly × effort hours** (engineering-heavy product)

### 3.1 Assumptions specific to you

| Assumption | Value |
|---|---|
| Delivery | Sri Lankan software company |
| Asset base | **Existing codebase + facilities** (not starting from zero) |
| Goal | Production hardening, missing modules, QA, deploy, handover |
| Effort shape | **4–7 calendar months** typical for Standard package complexity |

### 3.2 Person-month budget (market-aligned)

| Role | Months (equiv.) | Loaded monthly cost band (LKR) | Subtotal band (LKR) |
|---|---:|---:|---:|
| Senior full-stack | 3.0–5.0 | 500,000 – 950,000 | 1,500,000 – 4,750,000 |
| Mid full-stack | 4.0–7.0 | 260,000 – 520,000 | 1,040,000 – 3,640,000 |
| QA | 1.5–3.0 | 180,000 – 380,000 | 270,000 – 1,140,000 |
| PM / BA | 1.0–2.5 | 220,000 – 650,000 | 220,000 – 1,625,000 |
| DevOps (partial) | 0.5–1.5 | 260,000 – 650,000 | 130,000 – 975,000 |

**Subtotal (roles only):** about **LKR 3,160,000 – 12,130,000**  
Then add **contingency + company margin + warranty** (commonly **+15% to +35%**):  
**≈ LKR 3.6M – 16.4M** as a *wide* bracket.

This wide bracket is why proposals usually collapse into **packages** (see Section 4).

### 3.3 Effort-hours × blended rate (sanity check)

For a CRM with your stack (Next + TS + Prisma + reports/exports + RBAC):

| Work type | Hours (range) | Blended LKR/hour (range) | Subtotal (LKR) |
|---|---:|---:|---:|
| Core product hardening & features | 900 – 1,600 | 3,500 – 7,500 | 3,150,000 – 12,000,000 |
| QA + UAT cycles | 150 – 350 | 2,800 – 6,000 | 420,000 – 2,100,000 |
| DevOps + release | 80 – 200 | 3,500 – 8,000 | 280,000 – 1,600,000 |

**Cross-check total:** about **LKR 3.85M – 15.7M** (matches the person-month wide bracket).

**Narrowing rule:** Because you have **existing facilities**, subtract roughly **15%–30%** versus a greenfield build of the same features.

**Narrowed implementation range (recommended for planning):**  
**LKR 5.5M – 9.5M** for a “Standard CRM delivery” quality level on an existing base.

---

## 4. Recommended public budget packages (features + price)

Aligned to **your stack** and **SL market reality**, using **transparent package pricing** (same structure as `PUBLIC_BUDGET_AND_FEATURES_SRI_LANKA.md`).

| Package | What’s included (feature-level) | One-time budget (LKR) |
|---|---|---:|
| **Essential** | Auth, core RBAC, inquiries, campaigns (basic), tasks/Kanban, dashboard, basic admin, short docs | **4,200,000 – 5,800,000** |
| **Standard (recommended)** | Essential + activity logs, reporting UI, Excel/PDF exports, QA, deploy pipeline, training | **6,250,000 – 8,750,000** |
| **Full / enterprise-ready** | Standard + stronger security review, extended QA, performance hardening, extended documentation | **8,500,000 – 12,500,000** |

### Monthly OPEX (typical, separate from development)

| Item | Monthly (LKR) |
|---|---:|
| Cloud (app + DB + backups) | 45,000 – 220,000 |
| Support retainer (standard) | 120,000 – 300,000 |
| Email/SMS/WhatsApp | usage-based |

---

## 5. Why your stack supports this budget level

- **Next.js + TypeScript + Prisma** is a **high productivity** stack, but the product still includes **security (JWT/RBAC)**, **reporting**, and **export pipelines**—these are **not “simple website” hours**.
- **jsPDF + xlsx** work is **feature engineering + QA** (edge cases, large exports).
- **AWS S3** and optional **Supabase/Redis** add **integration and operational** work.

---

## 6. What to ask a Sri Lankan company (so quotes are comparable)

Ask for a fixed proposal that includes:

- Milestones tied to **deliverables** (not just hours)
- Warranty period for defects
- SLA for support (optional)
- Hosting assumptions (who pays cloud bills)
- Whether third-party messaging/email usage is included or pass-through

---

## 7. Disclaimer

Market pages and hourly guides vary by vendor quality, speed, and scope definition. This document is a **planning budget** based on:

- your **actual tech stack** in this repository, and  
- **publicly referenced** Sri Lankan / regional pricing signals.

Final price must come from a signed Statement of Work (SOW).

---

## References (external)

- [SlashDev – Sri Lanka developer hourly bands](https://slashdev.io/blog/hiring-developers-from-sri-lanka-a-brief-overview)  
- [Lemon.io – Sri Lanka rates](https://lemon.io/rate-calculator/sri-lanka/)  
- [PayScale – Software development hourly (Sri Lanka)](https://www.payscale.com/research/LK/Industry=Software_Development/Hourly_Rate)  
- [Web-dev.lk – Sri Lanka web dev pricing context](https://www.web-dev.lk/web-development-price-sri-lanka)  
- [SafeNet Creations – Website cost guide (Sri Lanka)](https://www.safenetcreations.com/blog/website-cost-sri-lanka-2026-pricing-guide/)
