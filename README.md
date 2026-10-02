# CutoffSaathi — Full Stack

```
cutoffsaathi-fullstack/
├── frontend/     React + TanStack Start (built in Lovable, now wired to /backend)
└── backend/      Node.js + Express + MongoDB API
```

Start here:
1. `backend/README.md` — API setup, environment variables, data import, deployment checklist
2. `frontend/README-BACKEND-INTEGRATION.md` — frontend setup and exactly which pages call which endpoints

## Fastest path to a working local demo

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env        # fill in MONGO_URI at minimum to get started
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
cp .env.example .env        # default already points at localhost:5000
npm run dev
```

Then open the frontend URL Vite prints, and walk through Select → Checkout → Dashboard. Checkout will fail until you've added real Razorpay test keys to the backend `.env` — everything else (categories/branches, signup/login, admin) works as soon as MongoDB is connected and has at least a little cutoff data in it (see backend README section 4).
