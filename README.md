# TransitOps

**Smart Transport Operations Platform** — built for the Odoo Hackathon (8 Hours)

🔗 **Live Demo:** [https://odoo-hackathon-transit-ops-nine.vercel.app](https://odoo-hackathon-transit-ops-nine.vercel.app)

---

## Overview

TransitOps is a centralized fleet management platform that digitizes the complete lifecycle of transport operations — from vehicle registration and driver management to trip dispatching, maintenance scheduling, fuel logging, and financial analytics.

Built to replace spreadsheets and manual logbooks, it enforces business rules automatically and provides real-time operational visibility through a clean, role-based dashboard.

---

## Live Demo

| URL | [https://odoo-hackathon-transit-ops-nine.vercel.app/dashboard](https://odoo-hackathon-transit-ops-nine.vercel.app/dashboard) |
|---|---|
| Platform | Vercel |
| Backend | Supabase (PostgreSQL + Auth) |

---

## Features

### Authentication & Access Control
- Secure email/password login via Supabase Auth
- Role-Based Access Control (RBAC) with 4 roles
- Protected routes — unauthenticated users redirected to login

| Role | Access |
|---|---|
| Fleet Manager | Full access to all modules |
| Driver | Trips and Fuel Logs |
| Safety Officer | Vehicles, Drivers, Maintenance, Reports |
| Financial Analyst | Expenses and Reports |

---

### Dashboard
- KPIs: Fleet Size, Utilization %, Active Trips, Drivers on Duty
- Cost summary: Fuel, Maintenance, Other Expenses
- 6-month cost trend area chart
- Fleet distribution bar chart by status
- Trip breakdown with progress bars
- **Filters by vehicle type, status, and region** — all KPIs and charts update live

---

### Vehicle Registry
- Full CRUD with unique registration number enforcement
- Fields: Registration Number, Name/Model, Type, Region, Max Load Capacity, Odometer, Acquisition Cost, Status
- Status values: Available · On Trip · In Shop · Retired
- Grid and list view toggle
- Search, filter by type/status, document upload (PDF/image)

---

### Driver Management
- Full CRUD with unique license number enforcement
- Fields: Full Name, License Number, Category, Expiry Date, Phone, Safety Score, Status
- Status values: Available · On Trip · Off Duty · Suspended
- Expired license alerts and 30-day expiry warnings

---

### Trip Management
- Create trips: origin, destination, vehicle, driver, cargo weight, planned distance
- Only available vehicles and drivers with valid licenses shown in selection
- Cargo weight validated against vehicle max load capacity
- Full lifecycle: **Draft → Dispatched → Completed → Cancelled**
- Dispatch automatically sets vehicle and driver to On Trip
- Completion captures actual distance, fuel consumed, and revenue
- Cancellation of dispatched trips restores vehicle and driver to Available

---

### Maintenance
- Log maintenance records per vehicle
- Creating an active record automatically sets vehicle status to In Shop
- Closing a record restores vehicle to Available (unless retired)
- In Shop vehicles are hidden from trip dispatch selection

---

### Fuel & Expense Management
- Fuel logs: liters, cost per liter, total cost (auto-calculated), date, linked trip
- Expense tracking: tolls, insurance, salary, repairs, misc
- Per-vehicle cost breakdown (Fuel + Maintenance + Expenses)

---

### Reports & Analytics
- Per-vehicle metrics: Fuel Efficiency (km/L), Operational Cost, Revenue, ROI
- ROI formula: `(Revenue − (Maintenance + Fuel)) / Acquisition Cost × 100`
- Stacked cost bar chart and fuel efficiency chart
- **CSV export** and **PDF export** (landscape A4 with summary KPIs and full table)
- Filter by vehicle status

---

## Business Rules Enforced

- Registration numbers are unique
- Retired or In Shop vehicles never appear in dispatch
- Drivers with expired licenses or Suspended status cannot be assigned
- A driver or vehicle already On Trip cannot be assigned to another trip
- Cargo weight must not exceed vehicle max load capacity
- Dispatching a trip sets both vehicle and driver to On Trip
- Completing a trip sets both back to Available
- Cancelling a dispatched trip restores both to Available
- Creating an active maintenance record sets vehicle to In Shop
- Closing maintenance restores vehicle to Available (unless retired)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Routing | React Router v7 |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Charts | Recharts |
| PDF Export | jsPDF + jspdf-autotable |
| Styling | CSS custom properties (dark theme) |
| Deployment | Vercel |

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/Odoo_Hackathon_TransitOps.git
cd Odoo_Hackathon_TransitOps

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key to .env

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run `supabase_schema.sql` in your Supabase SQL Editor to create all tables, RLS policies, and triggers.

---

## Project Structure

```
src/
├── components/
│   ├── layout/        # AppLayout, Sidebar, ProtectedRoute
│   └── ui/            # Badge, Modal, Table, Skeleton, ChatBot
├── context/           # AuthContext, ToastContext
├── lib/               # Supabase client
└── pages/
    ├── auth/          # Login
    ├── dashboard/     # Dashboard with filters
    ├── vehicles/      # Vehicle Registry
    ├── drivers/       # Driver Management
    ├── trips/         # Trip Management
    ├── maintenance/   # Maintenance Logs
    ├── fuel/          # Fuel Logs
    ├── expenses/      # Expense Tracking
    └── reports/       # Analytics + CSV/PDF Export
```

---

## Bonus Features Implemented

- Dark mode (system-wide dark theme)
- Vehicle document management (PDF/image upload via Supabase Storage)
- Search, filters, and sorting across all modules
- In-app assistant chatbot (bottom-right FAB) with fleet Q&A
- Responsive layout — works on desktop, tablet, and mobile

---

## Hackathon

Built in 8 hours for the **Odoo Hackathon**.  
Objective: End-to-end transport operations platform with vehicle, driver, dispatch, maintenance, and expense management.
