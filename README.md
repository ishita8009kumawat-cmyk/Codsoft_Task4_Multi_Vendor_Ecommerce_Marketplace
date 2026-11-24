# MarketHub — Multi-Vendor E-Commerce Marketplace

**CodSoft Internship · Full-Stack Web Development · Task 4**

A scalable multi-vendor marketplace that enables customers to shop from
multiple sellers in a single cart and checkout, while vendors manage their
own products, inventory, and orders from a dedicated dashboard — with an
admin overseeing the whole ecosystem.

## Tech stack

- **Frontend:** React (Vite), React Router, Tailwind CSS v4, Axios
- **Backend:** Node.js, Express
- **Database:** SQLite (via `better-sqlite3` — no separate database server needed)
- **Auth:** JWT + bcrypt password hashing

## Features

- **Role-based access** — Admin (platform), Vendor (seller), and Customer (buyer) each get a dedicated dashboard and permissions.
- **Admin:** view marketplace-wide stats (GMV, top vendors by revenue, live products, customers); suspend or reactivate vendor accounts; manage the shared product category list; view every order placed on the platform.
- **Vendor:** manage their own product catalog (create, edit, list/unlist, delete, track stock); fulfill orders — see every item ordered from their store across all customers and move each one through pending → shipped → delivered (or cancelled) independently of other vendors in the same order; edit their public store profile.
- **Customer:** browse the unified product catalog with keyword and category search; add items from **multiple different vendors to a single cart**; check out once — the order is automatically split behind the scenes so each vendor only sees and fulfills their own items; track order and per-item delivery status.
- Self-service **sign-up** for both vendors (with store name) and customers.
- Stock is validated and decremented server-side at checkout; a suspended vendor's products disappear from the storefront and they're blocked from logging in.

## Project structure

```
markethub/
├── backend/          Express API + SQLite database
│   ├── db.js           schema + seed data (auto-runs on first start)
│   ├── server.js        app entry point
│   ├── middleware/       JWT auth + role guard
│   └── routes/           auth, categories, products, vendors, orders, dashboard
└── frontend/         React (Vite) single-page app
    └── src/
        ├── pages/admin | vendor | customer
        ├── components/    Layout, shared UI (StatCard, Modal, Stamp, etc.)
        ├── AuthContext.jsx
        ├── CartContext.jsx   multi-vendor cart state, grouped by store
        └── api.js             axios client with JWT injection
```

## Getting started

### 1. Backend

```bash
cd backend
npm install
npm start
```

The API starts on **http://localhost:5003**. On first run it automatically
creates `markethub.db` (SQLite file) and seeds it with sample vendors,
products, customers, and orders — the demo credentials are printed in the
terminal.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens on **http://localhost:5173**. It's configured to proxy `/api`
requests to the backend on port 5003, so just make sure the backend is
running first.

### 3. Log in

Use any of the seeded demo accounts (also available as quick-fill buttons on
the login screen), or sign up as a new vendor or customer directly from the
login page:

| Role     | Email                              | Password       |
|----------|--------------------------------------|----------------|
| Admin    | `admin@markethub.test`              | `admin123`     |
| Vendor   | `karan@gadgetgrove.test`            | `vendor123`    |
| Vendor   | `ritu@homehaven.test`               | `vendor123`    |
| Customer | `neha.customer@markethub.test`      | `customer123`  |

## Resetting the data

Delete `backend/markethub.db*` and restart the backend — it will recreate
the schema and reseed demo data automatically.

## Notes

- This is a demo/learning project (per the internship's scope of a working
  prototype); the JWT secret in `middleware/auth.js` should be moved to an
  environment variable (`.env`) before any real deployment, and a payment
  gateway would need to be integrated for real online payments.
- Prices are shown in ₹ (INR) for the demo data — this is just formatting in
  the frontend and not hardcoded in the backend logic.
