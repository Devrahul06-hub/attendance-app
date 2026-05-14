#Wtp!GNvWX@t@tu4
# PunchPilot — Attendance Management System (POC)

A modern, mobile-first attendance management prototype built with **Next.js 14**, **MongoDB**, **Tailwind CSS**, and **Google Drive API**. Designed to feel like a real SaaS product — clean enough to demo to clients, simple enough to extend later.

> **This is a prototype.** Auth, validation, and architecture are intentionally lean. Production hardening (rate limiting, refresh tokens, audit logs, etc.) is left as scope.

---

## ✨ Features

**Authentication**
- Email/password signup & login (JWT in httpOnly cookie)
- Protected routes via Next.js middleware
- Two roles: **admin** and **employee** (first signup auto-promoted to admin)

**Employee workflow**
- One-tap Present / Absent marking
- Optional remarks
- Optional photo upload from **desktop, mobile gallery, or camera** → auto-saved to **Google Drive**
- Duplicate-prevention: one record per user per day (enforced at DB level)
- Personal history with search & filter

**Admin dashboard**
- Live stats: total users, present today, absent today, total records
- All attendance records with filters: **date, user, status, name/email search**
- All users list with per-user export
- **Excel export** (all records OR single user) via SheetJS

**UI/UX**
- Sidebar + top navbar layout
- Fully responsive (mobile → desktop)
- Toast notifications (react-hot-toast)
- Loading states + skeletons
- Clean SaaS aesthetic, custom branding

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Next.js API routes (Node runtime) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (bcryptjs + jsonwebtoken) in httpOnly cookies |
| File Storage | Google Drive API (service account) |
| Excel | SheetJS / `xlsx` |
| Icons | lucide-react |
| Toasts | react-hot-toast |

All services used are **free-tier friendly**: MongoDB Atlas M0, Google Cloud free tier.

---

## 📁 Project Structure

```
attendance-app/
├── src/
│   ├── app/
│   │   ├── api/                    # All backend routes
│   │   │   ├── auth/{login,signup,logout,me}/route.ts
│   │   │   ├── attendance/{route,today,history}/route.ts
│   │   │   ├── upload/route.ts     # Google Drive upload
│   │   │   └── admin/{users,records,stats,export}/route.ts
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── dashboard/{page,DashboardClient}.tsx
│   │   ├── attendance/{page,AttendanceClient}.tsx
│   │   ├── admin/{page,AdminClient}.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Root → redirects based on session
│   │   └── globals.css
│   ├── components/                 # Reusable UI
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── Logo.tsx
│   │   └── Spinner.tsx
│   ├── lib/                        # Helpers
│   │   ├── db.ts                   # Mongo connection (cached)
│   │   ├── auth.ts                 # JWT sign/verify + session
│   │   └── drive.ts                # Google Drive upload
│   ├── models/                     # Mongoose schemas
│   │   ├── User.ts
│   │   └── Attendance.ts
│   └── middleware.ts               # Route protection
├── scripts/
│   └── seed.js                     # Optional sample data
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🚀 Setup (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up MongoDB Atlas (free)

1. Create a free account at https://cloud.mongodb.com
2. Create a new **M0** cluster
3. Add a database user (Database Access)
4. Whitelist your IP — or `0.0.0.0/0` for dev (Network Access)
5. Copy the connection string

### 3. Set up Google Drive API (free)

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable **Google Drive API**
4. Go to **IAM & Admin → Service Accounts** → Create service account
5. Create a JSON key → download it
6. In Google Drive, create a folder for uploads → **Share** it with the service account email (give "Editor" access)
7. Copy the folder ID from its URL (`drive.google.com/drive/folders/<THIS_PART>`)

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=any-long-random-string
GOOGLE_CLIENT_EMAIL=...@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=...
ADMIN_EMAIL=admin@example.com
```

> **Tip:** `GOOGLE_PRIVATE_KEY` from the service account JSON contains real newlines. When pasting into `.env.local`, wrap in double quotes and keep the `\n` escapes — the code converts them.

### 5. (Optional) Seed sample data

```bash
node scripts/seed.js
```

This creates 5 sample users (including 1 admin) with ~14 days of attendance history. Login with any seeded email and password `password123`.

### 6. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🧭 First-time Walkthrough

1. Visit **/signup** and create the first account → it becomes **admin** automatically
2. Sign up a second account (different email) → it becomes **employee**
3. As the employee, go to **Attendance** → mark Present with a photo
4. Switch to the admin → **Admin Panel** → see stats, records, filters, and Excel export

---

## 🔌 API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Current session |
| GET | `/api/attendance` | Own history |
| POST | `/api/attendance` | Mark today's attendance |
| GET | `/api/attendance/today` | Today's record (if any) |
| POST | `/api/upload` | Upload image → Google Drive |
| GET | `/api/admin/stats` | Admin: dashboard stats |
| GET | `/api/admin/users` | Admin: list users |
| GET | `/api/admin/records?date=&userId=&status=&search=` | Admin: filtered records |
| GET | `/api/admin/export?userId=&date=` | Admin: Excel download |

---

## 🧱 Data Models

**User**
```ts
{ name, email (unique), passwordHash, role: 'admin'|'employee', createdAt }
```

**Attendance**
```ts
{
  userId (ref User),
  name, email,            // denormalized for fast listing/export
  date: 'YYYY-MM-DD',     // unique per user (compound index)
  time: 'HH:mm:ss',
  status: 'present'|'absent',
  remarks?: string,
  imageUrl?: string,      // Google Drive webViewLink
  imageFileId?: string,
  createdAt
}
```

---

## 🔄 Scaling to Production

Quick wins when promoting this beyond a demo:
- Replace JWT-in-cookie with **NextAuth** or **Clerk** for SSO/social login
- Add **refresh tokens** + token rotation
- **Rate limit** auth + upload endpoints
- Add **pagination** to admin tables (current cap: 500 records)
- Add **per-user admin actions**: deactivate, change role
- **Audit logs** for admin actions
- Switch image storage to **S3 / Cloudflare R2** when scale demands it
- Add **automated tests** (Vitest + Playwright)

---

## 📜 License

MIT — use freely as a starter for client demos.
