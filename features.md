# Features

Insurance renewal manager for tracking policies, customers, and reminders across insurance companies and brokers.

## Core

- **Dashboard** — real-time stats: total policies, active/expired counts, active premium, and quick views into recent data.
- **Policies** — full CRUD with list and detail views. Every policy tracks:
  - Policy number, status (pending / active / expired / cancelled), premium + currency
  - Customer (person or company), insured subject ("what/where is insured")
  - Insurance company, insurance type, broker
  - Start/end dates with **term auto-fill** (Quarterly / Yearly / 3 Years → end date computed automatically)
  - Payment mode (Quarterly / Yearly)
  - Notes
  - **Quarterly breakdown table** — when term is Quarterly, shows the 4 quarterly periods, per-quarter amount, and yearly total (amount × 4)
  - Duplicate policy-number check on save
- **Customers** — person or company profiles; person shows name + gender, company shows company name + type (Private Limited, LLP, Partnership, Sole Proprietorship, One Person Company, Firm, etc.). Name is displayed consistently across the app via a shared helper.
- **Insurance Companies** — CRUD reference list.
- **Insurance Types** — CRUD reference list (e.g. fire, motor, burglary, etc.).
- **Brokers** — CRUD reference list.
- **Reminders** — renewal/follow-up tracking with status (pending / done / expired / cancelled) and channel (in-app / email / SMS).
  - **Due-window filter pills**: All / ±30 days / Next 30 / 60 / 90 days, each showing a live **count badge** of how many reminders fall in that window (counts respect the status filter).
  - Mark done/pending, delete.
- **Reports** — grouped policy breakdowns with summary cards (Total Policies, Active, Expired, Active Premium).
  - Report views: **All Policies** (flat list), By Company, By Broker, By Type, By Customer, By Status — one-click buttons.
  - **Search** across policy #, customer, company, type, subject; **status filter** pills.
  - **Drill-down**: click any grouped row to see that entity's policies; back with "All entities".
  - **Export CSV** for the active view; **Print**-friendly layout.
- **Notifications** — in-app alerts.
- **Settings** — app preferences; currency fixed to INR.

## Auth & Roles

- Google sign-in with Firebase Auth.
- Roles: **Admin**, **Staff**, **Viewer**.
- Role-gated writes via Firestore security rules — viewers are read-only; admin/staff can create/edit/delete.
- Public landing page + login route; everything else requires auth.

## Technical

- React + TypeScript + Vite, Tailwind CSS, Firebase (Auth + Firestore), React Router.
- Firebase config baked into the bundle; deploys automatically on push to `main` (Vercel).
- Full horizontal-scroll responsive tables and mobile-friendly navigation.
