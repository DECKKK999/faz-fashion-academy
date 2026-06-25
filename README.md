# FAZ Academy — Fashion A-Z Academy Indonesia

Platform pembelajaran online untuk industri fashion Indonesia: kelas, e-book, event, dan sertifikasi.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend:** Express + Prisma (di folder `server/`)
- **Database:** PostgreSQL
- **Auth:** JWT (email/password) via httpOnly cookie

Frontend memanggil `/api/*` yang di-proxy Vite ke server Express (port 4000) saat development.

## Prasyarat

- Node.js 20+
- PostgreSQL berjalan secara lokal (mis. `brew services start postgresql@14`)

## Setup

### 1. Database

Buat database lokal:

```bash
createdb faz_academy_development
```

### 2. Backend (`server/`)

```bash
cd server
cp .env.example .env        # sesuaikan DATABASE_URL & JWT_SECRET
npm install
npm run db:push             # buat tabel sesuai prisma/schema.prisma
npm run seed                # buat admin default (admin@faz.test / admin123)
```

`DATABASE_URL` default mengarah ke Postgres lokal:
`postgresql://USER@localhost:5432/faz_academy_development?schema=public`

### 3. Frontend (root)

```bash
npm install
```

## Menjalankan (development)

Jalankan keduanya sekaligus dari root:

```bash
npm run dev:all
```

Atau di dua terminal terpisah:

```bash
npm run dev          # frontend  → http://localhost:8080
npm run dev:server   # API       → http://localhost:4000
```

Buka http://localhost:8080.

## Admin

- URL: `/admin`
- Akses butuh role `admin` atau `instructor`.
- Login admin default hasil seed: **admin@faz.test** / **admin123** (ganti password setelah login).

Menjadikan user sebagai admin (user harus sudah daftar):

```bash
cd server
npm run create-admin -- email@contoh.com                 # promote user yang sudah ada
npm run create-admin -- email@contoh.com password "Nama" # buat admin baru
```

## Struktur

```
.
├── src/                 # Frontend React
│   ├── lib/api.ts       # API client (fetch wrapper)
│   ├── contexts/        # AuthContext (JWT cookie)
│   └── pages/           # Halaman publik + /admin
└── server/              # Backend Express + Prisma
    ├── prisma/          # schema.prisma, seed, create-admin
    └── src/             # routes, auth middleware, server entry
```

## Skema database

Lihat `server/prisma/schema.prisma`. Tabel utama: `users`, `profiles`, `user_roles`,
`courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`.

## Production (ringkas)

- Set `JWT_SECRET` yang kuat dan `COOKIE_SECURE=true` (HTTPS).
- Build frontend: `npm run build` (output `dist/`), sajikan via reverse proxy yang
  meneruskan `/api` ke server Express.
- Build backend: `cd server && npm run build && npm start`.
