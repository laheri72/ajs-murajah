# Tech Stack Document

## 1. Objective
Build a fast, maintainable, free-to-start SaaS-style web app for room-based Quran progress tracking with an admin control panel and room-level login.

The stack must support:
- quick development
- strong dashboard UX
- structured relational data
- simple shared credentials for room heads
- future analytics and notification support

---

## 2. Recommended Stack
### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Zustand for lightweight client state
- TanStack Query for server state and caching
- Recharts for analytics charts

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- bcrypt for password hashing
- JWT or server sessions for authentication

### Database
- Supabase PostgreSQL

### Hosting
- Vercel for frontend and possibly API routes
- Supabase for database and related services

---

## 3. Why this stack fits the product
### React + TypeScript
Best fit for a modern dashboard. It gives:
- reusable components
- strong type safety
- fast UI iteration
- clean room/admin view separation

### Vite
- fast local development
- excellent TypeScript support
- easy build pipeline

### Tailwind + shadcn/ui
- fast professional UI building
- consistent layout and component styling
- ideal for a clean and modern SaaS interface
- easy to make responsive and mobile-friendly

### Zustand
- simple and lightweight state management
- suitable for room selection, dashboard filters, and local UI state

### TanStack Query
- manages server data elegantly
- ideal for dashboard refreshes, caching, and mutation updates
- helps keep the app responsive during progress updates

### Node.js + Express
- easy for custom auth and API control
- simple to extend later
- good fit for your existing knowledge

### Prisma
- clean database modeling
- excellent for PostgreSQL
- easy migrations
- helps future-proof the schema

### Supabase PostgreSQL
Best database choice because the product is highly relational:
- rooms belong to floors
- rooms have many progress records
- targets belong to rooms
- activities need timestamps
- analytics depend on structured queries

PostgreSQL is ideal for this.

### Vercel
- simple deployment for frontend
- strong CI/CD support
- great for modern React apps
- can later host lightweight API endpoints as needed

---

## 4. What not to use for MVP
### Do not use Google auth initially
Reason:
- not needed for shared room credentials
- increases login friction for this use case
- slows down onboarding

### Do not rely only on Firebase for core data
Reason:
- the app needs relational analytics
- room/floor/target relationships are easier in SQL
- progress reporting becomes cleaner in PostgreSQL

### Do not use a purely MySQL/phpMyAdmin setup as the main architecture
Reason:
- weaker long-term analytics workflow
- not as smooth for modern dashboard development
- less aligned with the future SaaS structure

---

## 5. Recommended authentication approach
### MVP auth model
- Admin login: username + password
- Room login: username + password
- Shared credentials per room
- Session persists in browser

### Implementation notes
- store password hashes with bcrypt
- store sessions in HTTP-only cookies or secure JWT flow
- avoid plain-text passwords
- allow password reset through admin later

This keeps the UX simple while still being reasonably safe for a campus-hostel internal tool.

---

## 6. Suggested database strategy
Use a relational schema built around:
- floors
- rooms
- room credentials
- progress entries
- targets
- notifications
- activity logs

This will make analytics and reporting straightforward.

### Example high-value tables
- floors
- rooms
- room_members (optional later)
- progress_entries
- targets
- users/admins
- activity_logs
- notifications
- goal_rules

---

## 7. Deployment architecture
### Preferred setup
- Frontend deployed on Vercel
- Backend deployed on Vercel serverless routes or a small Node service
- Database hosted on Supabase

### Alternative setup
- Frontend on Vercel
- Backend on Oracle VM
- Database on Supabase or PostgreSQL

The preferred setup is simpler and should be used first.

---

## 8. Future-ready expansion
This stack supports later additions such as:
- internal reminder notifications
- floor competitions
- charts and trends
- achievement system
- exports
- monthly goal automation
- mobile-friendly PWA behavior
- multi-hostel support

---

## 9. Final stack recommendation
**Use this as the standard stack for the MVP:**
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand + TanStack Query
- Node.js + Express + TypeScript
- Prisma ORM
- Supabase PostgreSQL
- Vercel hosting
- bcrypt + session-based login

This is the best balance of speed, maintainability, and future growth.

