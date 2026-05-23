# LIBCORE – Library Management System

A full-stack library management system with a React frontend and Express/Node.js backend.

---

## Project Structure

```
IPT-PROJECT/
├── backend/               ← Express + TypeScript API server
│   ├── src/
│   │   ├── routes/        ← All API route handlers
│   │   ├── lib/           ← Logger utility
│   │   ├── app.ts         ← Express app setup
│   │   ├── index.ts       ← Server entry point
│   │   ├── db.ts          ← Drizzle ORM schema + DB connection
│   │   └── schemas.ts     ← Zod validation schemas
│   ├── drizzle.config.ts  ← Drizzle Kit config (migrations)
│   ├── .env.example       ← Environment variable template
│   └── package.json
│
└── frontend/              ← React + Vite frontend
    ├── src/
    │   ├── pages/         ← Page components (one per route)
    │   ├── components/    ← Shared UI components
    │   │   ├── layout.tsx ← App shell with navbar + footer
    │   │   └── ui/        ← shadcn/ui components (stubs included)
    │   ├── lib/
    │   │   ├── api.ts     ← All API calls (fetch-based)
    │   │   └── auth.tsx   ← Auth context + useAuth hook
    │   ├── hooks/         ← Custom React hooks
    │   ├── App.tsx        ← Router + providers
    │   └── main.tsx       ← App entry point
    ├── index.html
    └── package.json
```

---

## Prerequisites

- **Node.js** v18 or higher
- **pnpm** (recommended) or npm
- **PostgreSQL** 14 or higher

---

## 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE libcore;
```

---

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and fill in your values
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and SESSION_SECRET

# Push the schema to your database (creates all tables)
npm run db:push

# Start the dev server (with hot reload)
npm run dev
```

The backend will start on **http://localhost:3001**.

### Environment Variables (backend/.env)

| Variable           | Description                              | Default                        |
|--------------------|------------------------------------------|--------------------------------|
| `DATABASE_URL`     | PostgreSQL connection string (required)  | –                              |
| `SESSION_SECRET`   | Cookie session secret (required)         | `libcore-dev-secret-...`       |
| `PORT`             | Port to listen on                        | `3001`                         |
| `CORS_ORIGIN`      | Frontend origin for CORS                 | `http://localhost:5173`        |
| `STRIPE_SECRET_KEY`| Stripe key (optional, enables payments)  | blank = demo mode              |
| `LOG_LEVEL`        | Pino log level                           | `info`                         |

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will start on **http://localhost:5173** and proxy `/api` requests to the backend automatically.

---

## 4. Copying Your Page Components

The `frontend/src/pages/` directory contains **stub** components as placeholders. You need to paste your actual page code from the original Replit project into each file:

| File                        | Route          | Description                    |
|-----------------------------|----------------|--------------------------------|
| `pages/home.tsx`            | `/`            | Landing page                   |
| `pages/login.tsx`           | `/login`       | Login form                     |
| `pages/register.tsx`        | `/register`    | Registration form              |
| `pages/books.tsx`           | `/books`       | Book catalog                   |
| `pages/borrow.tsx`          | `/borrow`      | Active borrows (protected)     |
| `pages/reservation.tsx`     | `/reservation` | Reservations (protected)       |
| `pages/history.tsx`         | `/history`     | Borrow history (protected)     |
| `pages/fines.tsx`           | `/fines`       | Fine management (protected)    |
| `pages/notifications.tsx`   | `/notifications` | Notifications (protected)    |
| `pages/admin.tsx`           | `/admin`       | Admin dashboard (admin only)   |

### Updating API calls in your pages

Replace any `@workspace/api-client-react` imports with the local API client:

```tsx
// BEFORE (Replit)
import { useListBooks } from "@workspace/api-client-react";

// AFTER (Local)
import { booksApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const { data } = useQuery({
  queryKey: ["books"],
  queryFn: () => booksApi.list(),
});
```

### Replacing shadcn/ui component stubs

The `components/ui/` folder has minimal stubs to get you started. For full functionality, install shadcn/ui:

```bash
cd frontend
npx shadcn@latest init
npx shadcn@latest add button tooltip popover toast
# add any other components you use
```

---

## 5. Building for Production

### Backend
```bash
cd backend
npm run build
NODE_ENV=production PORT=3001 DATABASE_URL=... SESSION_SECRET=... npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx, Caddy, or:
npm run preview
```

### Serving together with nginx (example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve built frontend
    root /path/to/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 6. Replit Components Removed

The following Replit-specific items have been stripped:

| Removed                              | Replaced with                          |
|--------------------------------------|----------------------------------------|
| `.replit` config file                | Standard npm scripts                   |
| `.replitignore`                      | Standard `.gitignore`                  |
| `.npmrc` (Replit registry)           | Standard npm/pnpm                      |
| `@replit/vite-plugin-cartographer`   | Removed (dev tool only)                |
| `@replit/vite-plugin-dev-banner`     | Removed                                |
| `@replit/vite-plugin-runtime-error-modal` | Removed                           |
| `@workspace/api-client-react`        | `src/lib/api.ts` (native fetch)        |
| `@workspace/db`                      | `backend/src/db.ts` (drizzle + pg)     |
| `@workspace/api-zod`                 | `backend/src/schemas.ts`               |
| Replit artifact build system         | Standard `tsc` + `tsx` dev runner      |
| Replit pnpm workspace                | Independent `package.json` per package |
| `PORT` required-or-throw             | Defaults to `3001`                     |

---

## API Endpoints

| Method | Path                           | Auth     | Description              |
|--------|--------------------------------|----------|--------------------------|
| GET    | `/api/healthz`                 | Public   | Health check             |
| POST   | `/api/auth/register`           | Public   | Register new user        |
| POST   | `/api/auth/login`              | Public   | Login                    |
| POST   | `/api/auth/logout`             | Session  | Logout                   |
| GET    | `/api/auth/me`                 | Session  | Get current user         |
| GET    | `/api/books`                   | Public   | List books               |
| POST   | `/api/books`                   | Session  | Add book                 |
| PUT    | `/api/books/:id`               | Session  | Update book              |
| DELETE | `/api/books/:id`               | Session  | Delete book              |
| GET    | `/api/borrow`                  | Session  | My borrows               |
| POST   | `/api/borrow`                  | Session  | Request borrow           |
| PATCH  | `/api/borrow/:id/return`       | Session  | Return book              |
| GET    | `/api/reservations`            | Session  | My reservations          |
| POST   | `/api/reservations`            | Session  | Create reservation       |
| GET    | `/api/history`                 | Session  | Borrow history           |
| GET    | `/api/fines/my`                | Session  | My fines                 |
| POST   | `/api/payments/create-session` | Session  | Pay fine                 |
| GET    | `/api/notifications`           | Session  | Notifications            |
| GET    | `/api/admin/stats`             | Admin    | Dashboard stats          |
| GET    | `/api/admin/requests`          | Admin    | All borrow requests      |
| PUT    | `/api/admin/approve/:id`       | Admin    | Approve borrow           |
| PUT    | `/api/admin/reject/:id`        | Admin    | Reject borrow            |
| GET    | `/api/analytics/overview`      | Admin    | Analytics overview       |
