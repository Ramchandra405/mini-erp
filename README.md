# Mini ERP + CRM Operations Portal

A full-stack Mini ERP + CRM built as a technical case-study project: customer relationship management, product/inventory tracking, and a sales-challan workflow with transactional stock control.

## 1. Project Overview

The portal lets a small operations team manage customers, products/stock, and outgoing sales challans (delivery notes) from one place, with role-based access for Admin, Sales, Warehouse, and Accounts staff.

## 2. Business Context

A distributor/wholesaler needs to: track customers and follow-ups, keep accurate stock levels, and issue sales challans against that stock without ever letting stock go negative or being double-counted. The system enforces those rules on the backend, not just in the UI.

## 3. Features

- JWT authentication with 4 roles (ADMIN, SALES, WAREHOUSE, ACCOUNTS), enforced server-side on every route
- Customer CRM: CRUD, search, filters, pagination, status/type tracking, follow-up history
- Product & inventory: CRUD, SKU/category, low-stock alerts, manual stock IN/OUT adjustments
- Stock movement ledger: every stock change (manual or challan-driven) is logged with reason, actor, and reference
- Sales Challans: draft → confirm/cancel workflow, automatic sequential challan numbers, product **snapshotting** so historical challans stay accurate even if a product is later renamed/repriced
- Transactional stock deduction on confirm: insufficient stock is rejected atomically, no partial updates, no duplicate confirmation
- Professional responsive React UI: sidebar + topbar layout, reusable component library, toasts, modals, loading/empty states
- Dashboard with live counts and recent activity

## 4. Technology Stack

**Backend:** Node.js, TypeScript, Express, PostgreSQL, Prisma ORM, JWT, bcrypt, Zod, Helmet, CORS, express-rate-limit
**Frontend:** React, TypeScript, Vite, React Router, TanStack Query, Axios, React Hook Form + Zod, Tailwind CSS, lucide-react

## 5. Architecture

Layered/clean architecture. Business logic lives only in backend `services/`, never in routes/controllers/React components.

```
Request → Middleware (Helmet/CORS/RateLimit) → Route → authenticate (JWT)
        → authorize(roles) (RBAC) → validateRequest (Zod) → Controller (thin)
        → Service (business logic + transactions) → Prisma → PostgreSQL
```

See `docs/01-architecture-and-plan.md` for the full architecture diagram, ER diagram, and challan business-flow diagram (Mermaid).

## 6. Folder Structure

```
mini-erp-crm/
├── backend/
│   ├── prisma/           # schema.prisma, seed.ts, migrations
│   ├── src/
│   │   ├── config/       # env, prisma client
│   │   ├── controllers/  # thin request/response handlers
│   │   ├── services/     # ALL business logic, incl. challan transactions
│   │   ├── routes/
│   │   ├── middleware/   # auth, RBAC, error handling, rate limiting, validation
│   │   ├── validators/   # Zod schemas
│   │   ├── utils/
│   │   └── server.ts
│   └── tests/            # Jest + Supertest, incl. full challan acceptance flow
├── frontend/
│   └── src/
│       ├── api/          # Axios calls per module
│       ├── components/ui # Button, Input, Modal, DataTable, Badge, etc.
│       ├── components/layout
│       ├── pages/         # one folder per module
│       ├── context/       # AuthContext
│       └── routes/        # AppRouter with role-gated routes
└── docs/
    ├── 01-architecture-and-plan.md
    └── postman_collection.json
```

## 7. Database Design

Tables: `users`, `customers`, `customer_followups`, `products`, `stock_movements`, `challans`, `challan_items`, `challan_counters`.

Key design decisions:
- **Product snapshotting**: `challan_items` stores `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot` in addition to `productId`, so historical challans are unaffected by later product edits.
- **Atomic challan numbering**: a `challan_counters` row per year is incremented with the challan creation, inside the same DB transaction — avoids race conditions from `COUNT(*)`-based numbering.
- **Soft deletes**: `Product.isActive` / `Customer.status = INACTIVE` instead of hard deletes, since historical challans reference these rows.
- Unique constraints: `User.email`, `Product.sku`, `Challan.challanNumber`. Indexes on all frequently-filtered columns (status, category, foreign keys).

Full ER diagram: see `docs/01-architecture-and-plan.md`.

## 8. API Documentation

Base URL: `http://localhost:4000/api` (or your deployed backend URL). All responses: `{ success: boolean, data?, message? }`.

| Method | Endpoint | Roles |
|---|---|---|
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |
| POST | `/auth/logout` | Authenticated |
| GET/POST | `/users`, `/users/:id` | ADMIN |
| GET/POST | `/customers` | ADMIN, SALES, ACCOUNTS (read) / ADMIN, SALES (write) |
| GET/PUT/DELETE | `/customers/:id` | see role matrix below |
| GET/POST | `/customers/:id/followups` | ADMIN, SALES, ACCOUNTS (read) / ADMIN, SALES (write) |
| GET/POST | `/products` | All (read) / ADMIN, WAREHOUSE (write) |
| GET/PUT/DELETE | `/products/:id` | see role matrix |
| GET | `/inventory`, `/inventory/movements` | All roles |
| POST | `/inventory/movements` | ADMIN, WAREHOUSE |
| GET/POST | `/challans` | All (read) / ADMIN, SALES (write) |
| GET/PUT | `/challans/:id` | All (read) / ADMIN, SALES (edit, draft only) |
| POST | `/challans/:id/confirm` | ADMIN, SALES |
| POST | `/challans/:id/cancel` | ADMIN, SALES |
| GET | `/dashboard/summary` | All roles |

Import `docs/postman_collection.json` into Postman for ready-to-run requests with a token variable.

## 9. Authentication

Stateless JWT. Login returns a token (default expiry 8h, configurable via `JWT_EXPIRES_IN`). Send it as `Authorization: Bearer <token>` on every subsequent request. Passwords are hashed with bcrypt (10 salt rounds); `passwordHash` is never returned in any API response.

## 10. Role Permissions

| Module | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|---|---|---|---|
| Users | Full | — | — | — |
| Customers | Full | Full | — | Read-only |
| Products | Full | Read-only | Full | Read-only |
| Inventory / Stock Movements | Full | Read-only | Full | Read-only |
| Sales Challans | Full | Full | Read-only | Read-only |
| Dashboard | Full | Full | Full | Read-only |

Enforced in `middleware/authorize.ts` on the backend — the frontend only hides buttons for UX, it is never the source of truth.

## 11. Business Rules — Sales Challan & Stock

1. Creating a challan always starts it as `DRAFT`. Stock is **not** touched.
2. Confirming a challan (`POST /challans/:id/confirm`) runs inside a single Prisma transaction that:
   - Re-checks `status === DRAFT` **inside** the transaction (prevents duplicate confirmation under concurrent requests).
   - Verifies every line item has sufficient `currentStock`.
   - If any item is short, the entire transaction rolls back — no partial stock deduction.
   - On success: decrements stock per item, writes an `OUT` `StockMovement` per item (`referenceType=CHALLAN`), and marks the challan `CONFIRMED` with `confirmedAt`.
3. A `CONFIRMED` or `CANCELLED` challan can never be confirmed or edited again.
4. A `DRAFT` challan can be edited (re-snapshots items) or cancelled.
5. Manual stock adjustments (`POST /inventory/movements`) follow the same "never go negative" rule for OUT movements.

## 12. Environment Variables

**Backend (`backend/.env`, see `.env.example`):**
```
DATABASE_URL=postgresql://user:password@host:5432/db?schema=public
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=8h
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (`frontend/.env`, see `.env.example`):**
```
VITE_API_URL=http://localhost:4000/api
```

Never commit `.env`. Both `.gitignore` files already exclude it.

## 13. Local Setup (Windows + VS Code)

```powershell
# 1. Clone / open the project folder in VS Code, open a terminal in the repo root

# 2. Backend
cd backend
copy .env.example .env
:: edit .env — set DATABASE_URL to your Postgres/Neon/Supabase connection string
npm install
npm run prisma:generate
npm run prisma:migrate      :: creates tables from schema.prisma
npm run seed                :: seeds 4 users, 10 customers, 15 products, sample challans
npm run dev                 :: starts API on http://localhost:4000

# 3. Frontend (in a second terminal)
cd frontend
copy .env.example .env
npm install
npm run dev                 :: starts UI on http://localhost:5173
```

Test accounts (password for all: `Password@123`):
```
admin@example.com      (ADMIN)
sales@example.com      (SALES)
warehouse@example.com  (WAREHOUSE)
accounts@example.com   (ACCOUNTS)
```

## 14. Database Setup / Migration / Seed

- Use any PostgreSQL 14+ instance — Neon, Supabase, Render Postgres, or local Postgres all work; just set `DATABASE_URL`.
- `npm run prisma:migrate` (dev) creates/updates tables from `prisma/schema.prisma` and generates a migration file under `prisma/migrations/`.
- For production: `npm run prisma:migrate:deploy` applies existing migrations without prompting.
- `npm run seed` populates: 4 role accounts, 10 customers, 15 products (some intentionally below their minimum-stock threshold to exercise the low-stock UI), a handful of stock movements, follow-ups, and both DRAFT and CONFIRMED sample challans.

## 15. Running Backend / Frontend

```powershell
cd backend  && npm run dev     :: http://localhost:4000
cd frontend && npm run dev     :: http://localhost:5173
```

Health check: `GET http://localhost:4000/health`

## 16. Testing

```powershell
cd backend
npm test
```

`tests/challan.test.ts` is the most important suite — it exercises the exact final-acceptance-test flow: draft leaves stock unchanged, confirm reduces stock and writes an OUT movement, duplicate confirmation is rejected, over-quantity confirmation is rejected with stock unchanged, and a product's historical snapshot survives a later product edit. `tests/auth.test.ts` and `tests/product.test.ts` cover login/RBAC and manual stock-adjustment rejection.

Tests run against whatever `DATABASE_URL` is set (point it at a disposable test database, then `npm run prisma:migrate` against it before running tests).

**Sandbox note:** this repository was authored in an environment without outbound access to a live PostgreSQL instance or to `binaries.prisma.sh` (needed to download the Prisma query engine), so `prisma generate` / `npm test` / `tsc` for the backend could not be executed end-to-end in that sandbox. The **frontend** was fully installed and both `tsc -b` and `vite build` were run successfully. Every backend TypeScript error surfaced locally was traced to the un-generated Prisma client (missing model types) and not to application logic. Run `npm run prisma:generate` locally (with normal internet access) as the first step — this resolves those errors immediately, since your machine can reach the Prisma binary CDN.

## 17. Deployment

**Database:** Create a Neon or Supabase Postgres project, copy its connection string into `DATABASE_URL`.

**Backend (Render or Railway):**
1. Push the repo to GitHub.
2. New Web Service → point at `/backend`.
3. Build command: `npm install && npm run prisma:generate && npm run build`
4. Start command: `npm run prisma:migrate:deploy && npm start`
5. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, `FRONTEND_URL` (your deployed frontend URL), `PORT`.
6. After first deploy, run `npm run seed` once via the platform's shell/console.

**Frontend (Vercel):**
1. Import the repo, set root directory to `/frontend`.
2. Build command: `npm run build`, output directory: `dist`.
3. Env var: `VITE_API_URL=https://your-backend-url/api`.
4. `frontend/vercel.json` is included for SPA route rewrites.

## 18. Postman Collection

`docs/postman_collection.json` — import into Postman. Includes a `{{baseUrl}}` variable (defaults to `http://localhost:4000/api`) and a `{{token}}` variable that the Login request auto-populates via a test script, so every subsequent request authenticates automatically.

## 19. Assumptions

- Single JWT access token, no refresh-token rotation (reasonable for assignment scope).
- Soft delete for Products/Customers to preserve referential integrity of historical challans.
- Challan `PUT` only allowed while `status = DRAFT`.
- Manual stock adjustments and challan-driven deductions share the same `stock_movements` table, distinguished by `referenceType`.
- Dashboard figures are computed live (no caching layer) — fine at this data scale.

## 20. Known Limitations

- No refresh-token / silent re-auth — user must log in again after token expiry.
- No PDF export of challans (listed as a bonus feature, not implemented).
- No file/image uploads for products.
- Low-stock filtering is done in application code rather than a SQL-level comparison of two columns (Prisma doesn't support column-to-column filters portably); acceptable at this data scale but would move to a raw SQL view at larger scale.
- No automated CI pipeline (GitHub Actions) — listed as bonus, not implemented, per the "don't sacrifice required scope for bonuses" instruction.

## 21. Future Improvements

- Refresh tokens + silent renewal.
- PDF/print view for confirmed challans.
- Docker Compose for one-command local spin-up (Postgres + backend + frontend).
- GitHub Actions CI running `npm test` + both builds on every PR.
- Audit log for user management actions.

---

## Final Acceptance Test (manual walkthrough)

1. Log in as `sales@example.com`.
2. Create a customer.
3. Create a product with stock = 100.
4. Create a challan for quantity 10 → Save Draft. Confirm stock is still 100.
5. Confirm the challan → stock becomes 90; an OUT movement of 10 appears in Inventory.
6. Try confirming the same challan again → rejected, stock stays 90.
7. Create another challan for a quantity greater than available stock → confirmation rejected, stock unchanged.
8. Edit the product's name → open the earlier challan's detail page → the item still shows the **original** product name (snapshot).
9. Log in as `warehouse@example.com` → confirm Products/Inventory access but no Customers module.
10. Log in as `accounts@example.com` → confirm read-only access across modules, no create/edit buttons, and backend rejects any write attempt directly against the API regardless of the UI.
