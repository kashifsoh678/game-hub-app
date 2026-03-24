# Gaming Zone Management System

## Overview

A full-stack gaming zone management system that tracks PlayStation and Gaming PC usage, calculates hourly billing automatically, and provides reporting dashboards.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Authentication**: JWT + bcrypt
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Build**: esbuild (backend), Vite (frontend)

## Default Credentials

- **Admin**: admin@gamingzone.com / admin123
- **Staff**: staff@gamingzone.com / staff123

## Features

- JWT authentication with Admin and Staff roles
- Real-time device dashboard (12 devices: 4 PS5, 4 PS4, 4 Gaming PCs)
- Live timer per session (HH:MM:SS, updates every second)
- Automatic billing calculation (per minute, PKR)
- Session management (start/stop)
- Session history with filters and pagination
- Reports dashboard with charts (daily revenue, device usage)
- Device management (add/edit/delete)
- Settings page (business name, hourly rate, currency, timezone)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── gaming-zone/        # React frontend (Vite)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed.ts         # Database seeder
```

## Database Schema

- **users** - Admin and staff accounts with hashed passwords
- **devices** - Gaming devices (PS5, PS4, PC) with hourly rates
- **sessions** - Gaming sessions with start/end times, duration, billing
- **settings** - Business settings (name, default rate, currency, timezone)

## API Routes

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user (admin only)
- `GET /api/auth/me` - Get current user
- `GET/POST /api/devices` - List / create devices
- `PUT/DELETE /api/devices/:id` - Update / delete device
- `POST /api/sessions/start` - Start a session
- `POST /api/sessions/stop` - Stop a session
- `GET /api/sessions` - Session history (with filters, pagination)
- `GET /api/sessions/today` - Today's sessions
- `GET /api/reports/daily` - Daily revenue report
- `GET /api/reports/monthly` - Monthly stats
- `GET/PUT /api/settings` - Get / update settings

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Running the Seed Script

```bash
pnpm --filter @workspace/scripts run seed
```
