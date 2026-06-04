# Education CRM Web Application  
## Public Budget & Feature Map (Sri Lanka)

This document is a **transparent, feature-linked budget** for having the Education CRM web application **developed and supported by a Sri Lankan software company**, using **existing facilities** (existing codebase, standard cloud stack, and normal SL market rates—so prices are **comparable and openly understandable**, not hidden).

| Field | Value |
|---|---|
| Currency | LKR (Sri Lankan Rupees) |
| Pricing style | Market-style ranges (typical SL vendor quotes) |
| “Existing facilities” | Reuse of current application base + standard hosting/tooling |
| Valid for | Budgeting, tenders, and management approval |

---

## 1. What “existing facilities” includes

| Item | Meaning for budget |
|---|---|
| Existing codebase | Less cost than greenfield; budget assumes stabilization, not full rewrite |
| Standard stack | Next.js, TypeScript, Prisma, SQL DB—as in current project |
| Client infrastructure | Your domain, email, and policy for data hosting (SL or global cloud) |
| Third-party usage | SMS/WhatsApp/email APIs billed **separately** by usage |

---

## 2. Features and development budget (one-time, LKR)

Each line is a **deliverable feature area** with a **public-style price band** (what many Sri Lankan companies quote for similar scope). Use **mid** for planning if you need a single number.

| # | Feature / module | What the client gets | Budget range (LKR) | Typical mid (LKR) |
|---:|---|---|---:|---:|
| F1 | **Authentication & sessions** | Login, logout, secure sessions, password flow | 350,000 – 650,000 | 500,000 |
| F2 | **Roles & permissions** | RBAC, role matrix, permission checks on APIs/UI | 600,000 – 1,100,000 | 850,000 |
| F3 | **Inquiry / seeker management** | Forms, validation, multi-program, follow-ups, pipeline | 900,000 – 1,600,000 | 1,250,000 |
| F4 | **Campaign management** | CRUD, status, analytics fields, seeker assignment | 800,000 – 1,450,000 | 1,125,000 |
| F5 | **Tasks & Kanban** | Board, drag‑drop, assignment, history | 650,000 – 1,200,000 | 925,000 |
| F6 | **Dashboard** | KPI cards, recent activity, settings | 550,000 – 1,000,000 | 775,000 |
| F7 | **Activity logs (admin)** | View, filter, export-oriented data | 500,000 – 950,000 | 725,000 |
| F8 | **Annual / operational reports** | Reports UI, charts, filters | 700,000 – 1,300,000 | 1,000,000 |
| F9 | **Exports (Excel / PDF)** | Activity, annual, campaign exports as implemented | 750,000 – 1,400,000 | 1,075,000 |
| F10 | **System settings & admin** | Config, toggles, logging switches | 350,000 – 700,000 | 525,000 |
| F11 | **QA, UAT support, bugfix window** | Test cycles, regression, stabilization | 550,000 – 1,000,000 | 775,000 |
| F12 | **DevOps & go-live** | Environments, deploy, SSL, basic monitoring | 450,000 – 900,000 | 675,000 |
| F13 | **Docs & training** | Admin/user guides, handover session | 250,000 – 550,000 | 400,000 |
| **—** | **Subtotal (features + delivery)** | **Full product delivery** | **~8,000,000 – 14,500,000** | **~11,600,000** |

**Overlap note:** In real quotes, vendors bundle F1–F13 into packages; the **sum above is not additive** if you buy a full package (see Section 3). Use Section 3 as the **official package budget**.

---

## 3. Recommended package budgets (public, with features)

These packages match how Sri Lankan companies usually sell: **one price band** for a **defined feature set**.

### Package A — Essential (MVP)

| Included | Budget (LKR) |
|---|---:|
| F1, F2 (core), F3, F4 (basic), F5, F6, F10, F13 (short) | **4,200,000 – 5,800,000** |

**Best for:** Small institute, fast rollout, limited reporting.

---

### Package B — Standard (recommended)

| Included | Budget (LKR) |
|---|---:|
| All of A + F7, F8, F9 (core exports), F11 (standard QA), F12 (standard deploy) | **6,250,000 – 8,750,000** |

**Best for:** Most education groups; full CRM + reporting + exports.

---

### Package C — Full / enterprise-ready

| Included | Budget (LKR) |
|---|---:|
| All features F1–F13, stronger QA, security hardening, extended documentation & training | **8,500,000 – 12,500,000** |

**Best for:** Multi-team, compliance-heavy, or high SLA expectations.

---

## 4. Monthly costs after launch (public OPEX, LKR)

| Area | What | Typical monthly (LKR) |
|---|---|---:|
| Cloud (app + DB + backups) | Standard managed hosting | 45,000 – 220,000 |
| Domain + SSL | Annual cost shown as monthly | 1,500 – 6,000 |
| Email (transactional) | If used | 3,000 – 45,000 |
| SMS / WhatsApp | **Usage-based** | 5,000 – 200,000+ |
| Support retainer | **Basic** | 55,000 – 120,000 |
| Support retainer | **Standard** | 120,000 – 300,000 |
| Support retainer | **Premium** | 300,000 – 900,000 |

**Typical monthly run-rate (app + basic cloud + standard support):** **LKR 180,000 – 350,000**

---

## 5. Optional add-ons (features + price)

| Add-on | Budget (LKR) |
|---|---:|
| WhatsApp Business API integration | 250,000 – 1,200,000 + usage |
| SMS gateway integration | 150,000 – 450,000 + usage |
| SSO (Google / Microsoft) | 300,000 – 1,500,000 |
| Advanced BI dashboards | 450,000 – 1,800,000 |
| Mobile app (React Native) | 1,800,000 – 6,500,000 |

---

## 6. Total first-year picture (example)

| Item | Example (LKR) |
|---|---:|
| Implementation (Package B mid) | ~7,500,000 |
| 12 months support (standard mid) | ~2,400,000 |
| Cloud + services (mid) | ~1,200,000 |
| **Indicative total year 1** | **~11,100,000** |

Adjust numbers up/down if you choose Package A or C, or change support tier.

---

## 7. Why this budget is “public” and fair

- Uses **feature-linked lines** so anyone can compare quotes.
- Uses **ranges** because Sri Lankan vendors differ by team size, seniority, and SLA.
- Assumes **existing facilities** (codebase + normal stack), so it is **not** priced as a full rewrite from zero.

---

## 8. Disclaimer

Figures are **planning and comparison budgets**, not a fixed quote. Final price depends on:

- Exact scope sign-off  
- UAT speed  
- Hosting choices  
- Integrations and data migration  

**Version:** 1.0  
**Date:** 2026-03-25  
