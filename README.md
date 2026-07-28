\# Mini ERP + CRM Operations Portal



A full-stack internal operations system for a wholesale/distribution company — built as a Full Stack Developer case study. Covers customer CRM, product \& inventory management, and a sales challan workflow with real-time stock control, all behind role-based authentication.



\*\*Live App:\*\* https://erp-system-3r77.vercel.app

\*\*Live API:\*\* https://erp-system-2c6t.onrender.com/api

\*\*GitHub:\*\* https://github.com/ShahMimansha/ERP-System



\---



\## Test Login Credentials



| Role | Email | Password |

|---|---|---|

| Admin | admin@erp.com | admin123 |

| Sales | sales@erp.com | sales123 |

| Warehouse | warehouse@erp.com | warehouse123 |

| Accounts | accounts@erp.com | accounts123 |



\---



\## Tech Stack



\*\*Backend:\*\* Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL, JWT auth, Zod validation

\*\*Frontend:\*\* React, TypeScript, Vite, Tailwind CSS, React Query, React Hook Form, Recharts

\*\*Database:\*\* PostgreSQL (hosted on Neon, serverless)

\*\*Deployment:\*\* Render (backend), Vercel (frontend), Neon (database) — all free-tier



\---



\## Architecture



The system follows a standard three-tier architecture with a clean separation between presentation, business logic, and data layers.



```

┌─────────────────┐        ┌──────────────────┐        ┌─────────────────┐

│   React (Vite)   │  HTTP  │  Express + TS API │  SQL   │   PostgreSQL     │

│   Vercel-hosted   │ ────► │   Render-hosted    │ ────► │   Neon-hosted    │

└─────────────────┘        └──────────────────┘        └─────────────────┘

```



\*\*Backend structure\*\* is modular by domain (`modules/auth`, `modules/customer`, `modules/product`, `modules/challan`), with each module owning its own controller, service, routes, and Zod validation schema. This keeps business logic isolated and testable per feature rather than spread across a single monolithic file.



\*\*Authentication\*\* uses stateless JWT tokens issued on login. A role field (`Admin`, `Sales`, `Warehouse`, `Accounts`) is embedded in the token payload and checked via middleware on protected routes, with the frontend additionally gating UI elements per role through a `PermissionGate` wrapper.



\*\*Data integrity for the Sales Challan module\*\* is the most business-critical part of the system:

\- Confirming a challan runs inside a database transaction that atomically deducts stock and appends a `StockMovement` log entry — both succeed or both roll back together.

\- Stock is validated server-side before deduction; insufficient stock returns a structured 400 error rather than allowing negative inventory.

\- Challan line items store a \*\*snapshot\*\* of product name and price at the time of sale (rather than only a foreign key), so historical challans remain accurate even if a product's price changes later.

\- Cancelling a confirmed challan reverses the transaction — stock is restored and a corresponding `IN` movement is logged — preserving a complete, append-only audit trail rather than allowing direct edits to stock history.



\*\*Frontend data fetching\*\* uses React Query for all server state (customers, products, challans), giving automatic caching, background refetching, and loading/error states without hand-rolled state management. Forms use React Hook Form with Zod resolvers, so client-side validation rules mirror the backend's Zod schemas.



\---



\## Database Schema



| Model | Purpose |

|---|---|

| `User` | Auth + role (Admin/Sales/Warehouse/Accounts) |

| `Customer` | CRM record: contact info, type, status, GST |

| `FollowUp` | Timestamped notes linked to a customer |

| `Product` | Inventory item: SKU, price, stock, min-alert threshold |

| `StockMovement` | Append-only audit log of every stock change (IN/OUT), with reason and actor |

| `Challan` | Sales document: customer, status (Draft/Confirmed/Cancelled), totals |

| `ChallanItem` | Line item with product snapshot (name + price at time of sale) + quantity |



\---



\## API Reference



Base URL: `https://erp-system-2c6t.onrender.com/api`



```

POST   /auth/login                          Login, returns JWT

POST   /auth/seed                           Seed 4 test users (one-time setup)



GET    /customers?search=\&status=\&customerType=\&page=\&limit=

POST   /customers

GET    /customers/:id

PATCH  /customers/:id

POST   /customers/:id/followups



GET    /products?search=\&category=\&lowStock=true\&page=\&limit=

POST   /products

GET    /products/:id

PATCH  /products/:id

POST   /products/:id/stock-movements        { quantity, movementType: 'IN'|'OUT', reason }



GET    /challans?search=\&status=\&customerId=\&page=\&limit=

POST   /challans                            { customerId, items: \[{productId, quantity}], status: 'DRAFT'|'CONFIRMED' }

GET    /challans/:id

PATCH  /challans/:id/confirm

PATCH  /challans/:id/cancel

```



All list endpoints support pagination and return `{ results, page, limit, totalPages, totalResults }`. All mutating endpoints validate input with Zod and return structured `{ status, message, errors? }` responses on failure.



\---



\## Running Locally



\### Prerequisites

\- Node.js 18+

\- A PostgreSQL database (local, or a free instance from Neon/Supabase)



\### 1. Clone and install

```bash

git clone https://github.com/ShahMimansha/ERP-System.git

cd ERP-System



cd backend

npm install



cd ../frontend

npm install

```



\### 2. Configure environment variables



\*\*`backend/.env`\*\*

```

DATABASE\_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require

JWT\_SECRET=<any-random-string>

PORT=4000

CORS\_ORIGIN=http://localhost:5173

```



\*\*`frontend/.env`\*\*

```

VITE\_API\_URL=http://localhost:4000/api

```



\### 3. Set up the database

```bash

cd backend

npx prisma generate

npx prisma migrate dev --name init

```



\### 4. Seed test users (one-time)

```bash

curl -X POST http://localhost:4000/api/auth/seed

```



\### 5. Run both servers

```bash

\# Terminal 1

cd backend

npm run dev



\# Terminal 2

cd frontend

npm run dev

```



Open `http://localhost:5173` and log in with any of the 4 test credentials above.



\---



\## Deployment



The live deployment uses entirely free-tier infrastructure:



| Layer | Service | Notes |

|---|---|---|

| Database | \[Neon](https://neon.tech) | Serverless PostgreSQL, 0.5GB free tier |

| Backend | \[Render](https://render.com) | Free web service, auto-deploys from `main` |

| Frontend | \[Vercel](https://vercel.com) | Free static hosting, auto-deploys from `main` |



\*\*Backend (Render) config:\*\*

\- Root directory: `backend`

\- Build command: `npm install \&\& npx prisma generate \&\& npm run build`

\- Start command: `npm start`

\- Env vars: `DATABASE\_URL`, `JWT\_SECRET`, `CORS\_ORIGIN` (set to the Vercel production domain)



\*\*Frontend (Vercel) config:\*\*

\- Root directory: `frontend`

\- Framework preset: Vite

\- Env var: `VITE\_API\_URL` (set to the Render backend URL + `/api`)

\- Includes a `vercel.json` rewrite rule (`/(.\*) → /index.html`) so client-side routes (e.g. `/login`, `/customers/:id`) don't 404 on direct load/refresh — required for any SPA using React Router.



Both services auto-redeploy on every push to `main`.



\---



\## Known Limitations



\- \*\*Render free-tier cold starts:\*\* the backend spins down after 15 minutes of inactivity. The first request after idle time can take 30–50 seconds to respond while the instance wakes up. This is expected free-tier behavior, not an application bug.

\- \*\*Production build skips the strict TypeScript project check:\*\* `npm run build` runs `vite build` directly rather than `tsc -b \&\& vite build`. The strict checker flags a number of non-blocking issues (a few unused variables, enum-import syntax under `erasableSyntaxOnly`, and some Zod/React Hook Form generic-inference mismatches) that don't affect runtime behavior — the app was fully functionally tested in dev mode and in the live deployment. Tightening these types fully is a good next iteration but wasn't essential to a working product within the 48-hour window.

\- \*\*No automated tests:\*\* given the time constraint, testing was manual (full click-through of all 4 roles and all 4 modules) rather than via a test suite. Adding Jest/Vitest coverage for the challan confirm/cancel stock logic would be the highest-value next addition, since it's the most business-critical code path.

\- \*\*No PDF export or S3 image upload:\*\* these were listed as bonus features in the brief and were deprioritized in favor of getting all core modules fully working end-to-end.

\- \*\*Low-stock detection is threshold-based only:\*\* it compares `currentStock` to `minStockAlert` on each read rather than triggering proactive notifications (e.g. email/webhook) when a product crosses the threshold.

\- \*\*Single database environment:\*\* there's no separate staging database — local dev and the live Render deployment currently point at the same Neon instance for simplicity during the assignment window. A production setup would split these.



\---



\## Author



Built by Mimansha Shah as a Full Stack Developer case study submission.

