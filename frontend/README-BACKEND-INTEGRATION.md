# CutoffSaathi — Frontend

React + TanStack Start (SSR) frontend, built in Lovable, now wired to the `/backend` API in this same delivery.

## Setup

```bash
cd frontend
npm install        # or bun install, both work — bun.lock is present
cp .env.example .env
npm run dev
```

`VITE_API_BASE_URL` in `.env` must point to your running backend (default `http://localhost:5000/api` matches the backend's default port).

## What's wired to the real API

| Page | Wired to |
|---|---|
| `/select` | `GET /api/meta/:examType/categories` and `/branches` (falls back to the static lists in `lib/data.ts` if the API is unreachable, so the wizard never breaks in isolation) |
| `/checkout` | `POST /api/orders` on load, then the real Razorpay Checkout script, then `POST /api/orders/verify` |
| `/dashboard` | `GET /api/orders/:orderId/result` — reads `?orderId=` from the URL, set automatically after checkout. Download buttons link straight to the PDF/Excel endpoints. |
| `/login`, `/signup` | `POST /api/auth/login` / `/api/auth/signup` |
| `/admin` | Gated behind an admin login form → `GET /api/admin/stats`, `GET/POST /api/admin/upload`, `GET /api/admin/orders`. Anyone who isn't logged in with `role: "admin"` sees the login gate instead of the dashboard. |

Everything else on the marketing pages (Home, How It Works, Pricing/FAQ) is still static content — no backend calls needed there.

## Build

```bash
npm run build
```

Outputs a deployable Nitro server bundle to `.output/` (this project is a full-stack TanStack Start app, so it needs a Node-capable host, not a static host — Render, Railway, or a Cloudflare Worker per `wrangler.json`).
