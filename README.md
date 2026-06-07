# EMS Frontend (Next.js)

Web UI for the Employee Management System.

## Pages

| Route        | Description                              |
|--------------|------------------------------------------|
| `/login`     | Secure sign-in                           |
| `/dashboard` | Landing page with stats                  |
| `/employees` | Employee CRUD                            |
| `/payrolls`  | Generate & view payrolls                 |
| `/taxes`     | Tax slab & sub-tax management            |
| `/reports`   | PDF/CSV report downloads                 |

## Running

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Ensure the backend API is running at the URL configured in `NEXT_PUBLIC_API_URL`.

## Auth Flow

1. User submits credentials on `/login`
2. API returns JWT + user object
3. Token stored in cookie (`ems_token`) via `js-cookie`
4. Axios interceptor attaches `Authorization: Bearer` header
5. 401 responses clear auth and redirect to `/login`

## Components

- `components/ui/` — Button, Input, Select, Modal, Alert
- `components/layout/` — Sidebar, DashboardLayout (auth guard)
