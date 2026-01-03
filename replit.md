# Presttech Ops Console

## Overview

Presttech Ops Console is a B2B sales operations platform designed to optimize cold calling and website sales to newly registered Brazilian companies (CNPJs). The system manages the complete sales funnel from lead generation through production delivery, with role-based access for SDR (Sales Development Representatives) and HEAD (managers).

Core functionality includes:
- Lead management with CSV import and API-based generation (Casa dos Dados integration)
- Guided call screen with scripted workflows and objection handling
- Diagnostic assessments with scoring and package recommendations
- Deal tracking with mandatory handoff to production
- Production task board (Kanban-style)
- Support ticket system
- Message templates and business rules management
- Duplicate detection and resolution
- LGPD/privacy compliance with opt-out handling

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for dashboard analytics
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy, express-session for session management
- **Password Hashing**: scrypt (crypto module)
- **Session Store**: PostgreSQL via connect-pg-simple
- **File Uploads**: Multer with memory storage

### Data Layer
- **Database**: PostgreSQL (Neon-compatible)
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` defines all tables and Zod schemas
- **Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` are used by both client and server
- **API Contract**: Routes defined in `shared/routes.ts` with Zod validation
- **Role-Based Access**: Middleware functions (`requireAuth`, `requireHead`) protect endpoints
- **Incremental Development**: Architecture supports adding features without rewrites

### Directory Structure
```
client/src/
  components/     # Reusable UI components
  pages/          # Route-level page components
  hooks/          # Custom React hooks for data fetching
  lib/            # Utilities and query client config

server/
  index.ts        # Express app setup
  routes.ts       # API route handlers
  auth.ts         # Authentication setup
  storage.ts      # Database operations interface
  db.ts           # Drizzle/PostgreSQL connection
  services/       # External service integrations

shared/
  schema.ts       # Drizzle tables + Zod schemas
  routes.ts       # API contract definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Neon**: Cloud PostgreSQL provider (production)

### External APIs
- **Casa dos Dados API**: Brazilian company data for lead generation (requires `CASA_API_KEY` server-side only)

### Key npm Packages
- **drizzle-orm / drizzle-kit**: Database ORM and migrations
- **@tanstack/react-query**: Async state management
- **zod / drizzle-zod**: Runtime validation
- **passport / passport-local**: Authentication
- **express-session / connect-pg-simple**: Session management
- **multer**: File upload handling
- **csv-parse**: CSV import processing

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key (defaults to development value)
- `CASA_API_KEY`: Casa dos Dados API key (optional, for lead generation feature)