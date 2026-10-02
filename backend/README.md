# CutoffSaathi — Backend API

Production-ready Node.js + Express + MongoDB backend for the CutoffSaathi cutoff-finder platform — covers the full State CET Cell taxonomy: 6 streams (Technical/Higher/Medical/Ayush/Agriculture/Fine Art Education), 56+ courses.

## Stack

- **Runtime:** Node.js 18+, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (httpOnly cookie + Bearer token support)
- **Payments:** Razorpay (order creation + signature-verified webhook)
- **File processing:** `xlsx` (cutoff sheet import), `pdfkit` + `exceljs` (sheet generation)
- **Security:** helmet, express-rate-limit, express-mongo-sanitize, CORS allowlist

## 1. Local setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in real values
npm run dev                # starts on http://localhost:5000 with nodemon
```

You need a MongoDB instance — either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended) or a local `mongod`. Put its connection string in `MONGO_URI`.

### Create your first admin account

```bash
node src/scripts/seedAdmin.js
```

Reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` and creates (or promotes) that user to `role: "admin"`. Change the password immediately after first login in production.

## 2. Folder structure

```
backend/
├── server.js                    # entry point — connects DB, starts HTTP server
├── src/
│   ├── app.js                   # Express app, middleware, route mounting
│   ├── config/
│   │   ├── db.js                # Mongoose connection
│   │   ├── razorpay.js          # Razorpay client instance
│   │   └── courseTaxonomy.js    # the 6-stream / 56-course source of truth
│   ├── models/
│   │   ├── Cutoff.js            # core denormalized cutoff document
│   │   ├── User.js               # auth + role (student/admin)
│   │   └── Order.js              # selection + payment state
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── metaController.js    # dropdown data (streams/courses/categories/branches/years)
│   │   ├── orderController.js   # checkout, webhook, payment-gated result + downloads
│   │   └── adminController.js   # Excel upload/import, stats, orders list
│   ├── routes/                  # one file per resource, mounted in app.js
│   ├── middleware/
│   │   ├── auth.js              # protect / optionalAuth / restrictTo
│   │   ├── upload.js            # multer config for admin file uploads
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js      # centralised error formatting
│   ├── utils/
│   │   ├── AppError.js
│   │   ├── generatePdf.js
│   │   └── generateExcel.js
│   └── scripts/
│       ├── importCutoffs.js     # CLI bulk import (bypasses upload size limits)
│       └── seedAdmin.js
└── uploads/tmp/                 # transient storage for admin file uploads (auto-cleaned)
```

## 3. Data model — the real course taxonomy, and why MongoDB is structured this way

The State CET Cell portal isn't "3 exam types" — it's **6 streams**, each with **10–20 independent courses** (56 total today). `src/config/courseTaxonomy.js` is the single source of truth for this list — copied directly from the official portal's own navigation (Technical/Higher/Medical/Ayush/Agriculture/Fine Art Education, each split into Post Graduate / Under Graduate courses).

Instead of separate `colleges` / `branches` / `categories` collections with joins, everything a query needs lives on each `Cutoff` document:

```js
{
  stream: "Technical Education",
  course: "B.E/B.Tech",
  college_name: "COEP Pune",
  college_code: "6109",
  branch_name: "Computer Engineering",
  category: "OBC",
  round: "CAP1",
  cutoff_percentile: 96.42,
  year: 2026
}
```

`stream` is a small closed set (6 values) so it's a schema-level enum. `course` has 56+ possible values and keeps growing as the portal adds more, so it's validated against `courseTaxonomy.js` at the controller/upload layer instead of being hardcoded in the Mongoose schema — adding a new course later is a one-line config change, not a database migration.

**Courses without real sub-branches** (NEET-UG, MCA, M.Ed., Fine Art, ...) still get a `branch_name` — it's set equal to the course name itself (`courseHasBranches()` in the taxonomy config controls this). This keeps every downstream query, grouping, and UI component (which all filter/group "by branch") identical regardless of whether the course has specializations — no special-casing needed elsewhere in the code.

A compound index on `{ stream, course, category, branch_name, year }` keeps the core query fast even across hundreds of thousands of rows.

## 4. Multi-year data — how 3 years of history actually gets stored and queried

The `year` field is what makes this work, and nothing else changes structurally — this is a **rows-accumulate, nothing-overwrites** model:

- The unique upsert key is `(college_code, course, branch_name, category, round, year)`. Notice `year` is *part of the key* — so importing 2026's data creates brand-new rows; it never touches 2024 or 2025's rows.
- Every admin upload (or CLI import) requires an explicit `year` value. There's no "current year" assumption anywhere in the backend — you always say which year's data you're loading.
- To serve "latest year" results (the default student experience), the frontend/backend picks the max value from `GET /api/meta/:stream/:course/years` — it doesn't hardcode a year.
- To build a 3-year trend feature later (compare a college's cutoff across 2024/2025/2026), query with `year: { $in: [2024, 2025, 2026] }` instead of a single year, and group the results by year on the frontend. The schema already supports this — no migration needed when you're ready to build that feature.
- Scale check: 6 streams × ~56 courses × ~8 categories × 3 rounds × 3 years × ~50 colleges/course ≈ low hundreds of thousands of rows at full maturity. That's a small collection by MongoDB standards — the compound index keeps every query fast well beyond this size. There's no reason to archive or delete old years; historical data is what makes the trend features valuable.

## 5. Getting your data in — no separate "master file" step needed

Your government-published Excel/PDF **is** the input. Two ways to load it:

**A. Admin panel** (`POST /api/admin/upload`, multipart file + `stream`/`course`/`round`/`year`) — good for routine per-round updates, ≤10MB files.

**B. CLI script** — good for the very first big backfill, or files larger than the upload limit:
```bash
node src/scripts/importCutoffs.js path/to/cap-round2-engineering.xlsx "Technical Education" "B.E/B.Tech" CAP2 2026
```

Both paths validate `stream`/`course` against `courseTaxonomy.js` (rejects typos before they hit the DB), and normalize branch-name/category aliases (e.g. "Comp"/"CE"/"Computer Engg" → "Computer Engineering") before an **upsert** — so re-uploading a corrected sheet never creates duplicates. Expected columns (case-insensitive, order doesn't matter): `College Name`, `College Code`, `Branch` (optional for branchless courses), `Category`, `Percentile`, `Rank` (optional).

**Branch dropdown before any data exists yet:** `GET /api/meta/:stream/:course/branches` doesn't just query live cutoffs — see `config/branchTaxonomy.js`. Resolution order: (1) live DB data, once uploaded, always wins; (2) a reference branch list per course, so e.g. B.E/B.Tech correctly shows Computer/Mechanical/Civil/... even before a single Excel has been imported; (3) the course name itself, for genuinely branchless courses (NEET-UG, MCA, ...). Add more courses to `branchTaxonomy.js` as needed — nothing else has to change.

**Fees are a separate upload from cutoffs** (`POST /api/admin/upload-fees`, model in `src/models/Fee.js`). A cutoff varies by category AND round AND year, but a fee is normally just one number per college+branch+year — so fees live in their own collection instead of being repeated on every one of a branch's ~24 cutoff rows (8 categories × 3 rounds) per year. Expected columns: `College Name`, `College Code`, `Branch` (leave blank to mean "this fee applies to every branch at this college"), `Fees`, `Fees Unit` (optional — `per_year` or `total_course`, defaults to `per_year`). When a student's result is built, `orderController.attachFees` looks up each college's fee — a branch-specific row wins if one exists, otherwise it falls back to that college's blank-branch row, otherwise the sheet just shows no fee for that college (it isn't required data).

## 6. Payment flow (how the ₹99 gate actually works)

1. `POST /api/orders` — **requires login** (no guest checkout — see section 7 for why). The student's selection (stream/course/category/branches) is saved as an `Order` with `status: "created"`, tied to `req.user._id`, and a matching Razorpay order is created. **No cutoff data is returned here.**
2. Frontend opens Razorpay Checkout using the returned `razorpayOrderId` + `keyId`.
3. On success, frontend calls `POST /api/orders/verify` with the payment ID + signature — this unlocks the UI immediately.
4. **Razorpay also calls `POST /api/webhooks/razorpay` server-to-server**, signed with `RAZORPAY_WEBHOOK_SECRET`. This is the authoritative confirmation — it fires even if the user closes the tab before step 3 completes, and it cannot be spoofed by a client.
5. `GET /api/orders/:orderId/result` checks `order.status === "paid"` **and** `order.user === req.user._id` before running any query. Both checks happen **only in the backend** — never trust a frontend-only "unlocked" flag.

Set up the webhook in your Razorpay dashboard pointing to `https://your-api-domain.com/api/webhooks/razorpay`, subscribed to the `payment.captured` event.

## 7. View-only result — no downloads, login required

There is deliberately no `/download/pdf` or `/download/excel` route, and no guest checkout. The reasoning:

- **Login is required before payment**, not after — `POST /api/orders` uses the `protect` middleware, so every order always has a `user`. This is what makes "only the buyer can ever view this" enforceable; a guest order would have no account to restrict viewing to later.
- **The result is JSON only, served to the dashboard, never as a file.** A PDF/Excel export is trivially forwardable — once it's a file on someone's disk, no backend check can touch it anymore. Keeping the sheet server-rendered means every view still goes through the payment + ownership check in `orderController.fetchPaidResult`.
- **A visible watermark** (`frontend/src/components/Watermark.tsx`) tiles the viewer's email, order ID, and a timestamp across the page. This does not, and cannot, prevent a screenshot or a phone camera pointed at the screen — no website can do that; it's not something browser JavaScript is ever told about. What it does do is make any leaked screenshot traceable back to exactly who and when, which is the actual industry-standard approach here (Netflix and exam portals use the same idea for the same reason).
- **`frontend/src/lib/useContentProtection.ts`** disables right-click, text selection, and Ctrl/Cmd+P (print), and blurs the content while the browser tab loses focus. These stop casual copy-pasting and screen-recording tools that only capture the focused window — they do not and cannot stop OS-level screenshots, dedicated screen-recording software, or a second device's camera. Don't oversell this to end users as "screenshot-proof"; it isn't, and no web product can honestly claim that.

If you later need a real downloadable artifact (e.g. an official-looking PDF a student can carry to counselling), that's a deliberate product decision to weigh against the leak risk it reopens — it isn't something this build left half-done.

## 8. API reference (summary)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account, sends OTP |
| POST | `/api/auth/verify-otp` | — | Verify OTP, logs in |
| POST | `/api/auth/resend-otp` | — | Resend OTP |
| POST | `/api/auth/login` | — | Log in (blocked until verified) |
| POST | `/api/auth/logout` | — | Clear session cookie |
| GET | `/api/auth/me` | student/admin | Current user |
| GET | `/api/meta/streams` | — | List the 6 streams |
| GET | `/api/meta/:stream/courses?level=` | — | Courses under a stream (optionally filtered by PG/UG) |
| GET | `/api/meta/:stream/:course/categories` | — | Live category list for dropdown |
| GET | `/api/meta/:stream/:course/branches?search=` | — | Branch list (live data → reference taxonomy → course name, see section 5) |
| GET | `/api/meta/:stream/:course/years` | — | Admission years with data available |
| POST | `/api/orders` | **required** | Create order + Razorpay order |
| POST | `/api/orders/verify` | optional | Client-side payment confirmation |
| GET | `/api/orders/mine` | required | My past orders |
| GET | `/api/orders/:id/result` | **required** | JSON cutoff result (payment + ownership gated) |
| POST | `/api/webhooks/razorpay` | signature | Razorpay server-to-server confirmation |
| GET | `/api/admin/stats` | admin | Dashboard stat cards |
| GET | `/api/admin/orders` | admin | Orders table |
| GET | `/api/admin/uploads-log` | admin | Recent cutoff import batches |
| POST | `/api/admin/upload` | admin | Upload + import a cutoff Excel file |
| GET | `/api/admin/fees-uploads-log` | admin | Recent fees import batches |
| POST | `/api/admin/upload-fees` | admin | Upload + import a fees Excel file (no round — see section 5) |

## 9. Deployment checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a real MongoDB Atlas cluster (not a local dev instance)
- [ ] Generate strong random values for `JWT_SECRET` and `COOKIE_SECRET` (e.g. `openssl rand -hex 32`)
- [ ] Switch Razorpay keys from `rzp_test_...` to live keys, and set the live webhook secret
- [ ] Set `CLIENT_URL` to your actual deployed frontend origin(s) — comma-separate if more than one
- [ ] Run `node src/scripts/seedAdmin.js` once, then change the admin password
- [ ] Point Razorpay's webhook URL at your deployed `/api/webhooks/razorpay`
- [ ] Recommended hosts: Render or Railway (Node + auto SSL); MongoDB Atlas for the DB
- [ ] Put the API behind HTTPS only — cookies are sent with `secure: true` in production

## 10. What's intentionally NOT included (roadmap, not gaps)

- Password reset flow (OTP-based email verification is now included — see section 11 — but "forgot password" reset isn't wired yet; same email utility can be reused for it)
- WhatsApp alerts (needs a WhatsApp Business API provider, e.g. Gupshup/Twilio)
- College Compare and Rank Predictor endpoints (marked "Coming soon" on the frontend)
- Automated tests (structure is set up for Jest + Supertest to be added per-controller)
- "Manage Colleges", "Categories/Branches", "Students", "Settings" admin sub-pages (still UI placeholders — wire similarly to Upload/Orders when needed)

## 11. Email OTP setup (signup verification)

Signup now sends a 6-digit code by email before the account is usable — `POST /api/auth/signup` creates an unverified user and emails the code; `POST /api/auth/verify-otp` checks it and logs the user in; `POST /api/auth/resend-otp` sends a new one. Login is blocked (`403`) until the account is verified.

**Easiest setup for local dev/small scale — Gmail SMTP (free, no third-party signup):**

1. You need 2-Step Verification turned on for the Gmail account you'll send from: [myaccount.google.com/security](https://myaccount.google.com/security) → "2-Step Verification" → follow the prompts.
2. Once that's on, go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Under "App name", type something like `CutoffSaathi` and click **Create**.
4. Google shows a 16-character password (e.g. `abcd efgh ijkl mnop`) — copy it, spaces don't matter.
5. In `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youraddress@gmail.com
   SMTP_PASS=abcdefghijklmnop        # the app password, not your normal Gmail password
   EMAIL_FROM="CutoffSaathi <youraddress@gmail.com>"
   ```
6. Restart the backend. Try signing up with a real email you can check — the OTP should land within seconds.

**If SMTP isn't configured yet:** the backend doesn't crash — it logs the OTP to the console instead (`[email] SMTP not configured — would have sent to ...`), so you can keep developing the rest of the flow and grab the code from the terminal.

**For production (higher volume, better deliverability):** swap to a dedicated provider — the code doesn't change, only the `.env` values do:
- [Resend](https://resend.com) — generous free tier, simplest API, has an SMTP endpoint too
- [Brevo](https://brevo.com) (formerly Sendinblue) — free tier, popular in India
- [SendGrid](https://sendgrid.com) — enterprise standard

For any of these: sign up, verify a sending domain (or use their sandbox domain while testing), get the SMTP host/port/username/password from their dashboard, and drop those into the same `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` variables — `src/utils/sendEmail.js` doesn't need to change.

## 12. Frontend integration status

The `/frontend` folder in this same delivery is fully wired to every endpoint above:

- `frontend/src/lib/api.ts` — the API client
- `/select` — Stream → Course → Category → Branches → Review, five-step wizard, live from `/api/meta/*`
- `/select` → `/login`/`/signup` → `/checkout` → `/dashboard` — login is required before checkout (no guest path); real order creation, Razorpay checkout, payment + ownership-gated result
- `/dashboard` — view-only in-browser result with the watermark and copy/print/right-click deterrents described in section 7; no download buttons
- `/admin` — real stats/upload/orders, gated behind an admin login screen

Set `frontend/.env` → `VITE_API_BASE_URL` to wherever this backend is running, and set this backend's `.env` → `CLIENT_URL` to wherever the frontend is running (comma-separate both local and deployed origins if needed). Both default to `localhost` ports that match each other out of the box.
