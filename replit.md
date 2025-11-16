# DJ & Karaoke Business Management System

## Overview

A comprehensive business management application designed for DJ and karaoke service companies. The system handles end-to-end operations including gig scheduling, customer relationship management, venue coordination, personnel management, financial tracking (invoices and payouts), and document storage. Built with a modern tech stack featuring React, Express, and PostgreSQL with role-based access control to support owners, managers, and personnel (DJs/staff).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React with TypeScript using Vite as the build tool
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod for form validation

**UI Component System**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with a customized design system
- "New York" style variant from shadcn/ui
- Custom theme implementation supporting light/dark modes
- Design follows principles from Linear, Notion, and Stripe Dashboard aesthetics

**State Management Strategy**
- Server state: TanStack Query with infinite stale time and manual refetching
- Authentication state: Context-based auth provider with session management
- Form state: React Hook Form for complex forms with multi-step validation
- UI state: Local component state using React hooks

**Key Design Decisions**
- Monorepo structure with shared schema between client and server
- Path aliases configured for clean imports (@/, @shared/, @assets/)
- Protected routes with role-based rendering
- Mobile-responsive design with collapsible sidebar navigation

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- Session-based authentication using Passport.js with Local Strategy
- PostgreSQL session store (connect-pg-simple)
- Custom middleware for request logging and authentication checks

**Authentication & Authorization**
- Passport.js with credentials strategy (email/username + password)
- bcryptjs for password hashing
- Three-tier role system: owner, manager, personnel
- Session-based auth with HTTP-only cookies
- Middleware guards: `requireAuth`, `requireManagerOrOwner`

**API Design**
- RESTful API structure under `/api` prefix
- Zod schema validation middleware for request bodies
- Async handler wrapper for consistent error handling
- Response format: JSON with appropriate HTTP status codes

**Business Logic Layer**
- Storage abstraction layer (`storage.ts`) providing data access methods
- Separation of concerns: routes handle HTTP, storage handles database operations
- Audit user context setting for tracking changes
- Transaction support through Drizzle ORM

### Data Storage

**Database: PostgreSQL via Neon Serverless**
- Neon serverless PostgreSQL with WebSocket connections
- Drizzle ORM for type-safe database queries and migrations
- Schema-first approach with TypeScript types generated from database schema

**Database Schema Design**

**Core Entities:**
- `users` - Authentication accounts with role-based access
- `personnel` - Internal staff (DJs, technicians, etc.) with full personal/tax information
- `customers` - Business or individual clients (polymorphic: business/person type)
- `venues` - Event locations with contact and capacity information
- `gigs` - Event bookings with date/time, assignments, and recurring event support
- `contacts` - External contacts (venue managers, customer contacts)

**Financial Tracking:**
- `personnel_payouts` - Payments to staff for gig work
- `gig_invoices` - Invoices sent to customers for gigs
- Payment methods and invoice status tracking

**Document Management:**
- `personnel_files` - File storage for tax forms, IDs, contracts
- Document type categorization
- File metadata (path, size, type, upload timestamp)

**Lookup/Reference Tables:**
- `venue_types`, `personnel_types`, `gig_types` - Configurable categorization
- `payment_methods`, `document_types`, `contact_roles` - System configuration
- All lookup tables have UUID primary keys for consistency

**Key Schema Features:**
- UUID primary keys for all tables
- Soft deletes via `is_active` flags on personnel
- Audit trail with `created_at`/`updated_at` timestamps
- Foreign key constraints with appropriate cascade behaviors
- Recurring gigs support through `recurrence_group_id`
- Many-to-many relationships: gigs-personnel assignments, venue-contacts, customer-contacts

**Data Integrity:**
- Unique constraints on emails and usernames
- NOT NULL constraints on required fields
- Enum types for controlled vocabularies (user_role, customer_type)
- ON DELETE behaviors: CASCADE for dependent data, RESTRICT for referenced entities

### External Dependencies

**Core Dependencies:**
- `@neondatabase/serverless` - Neon PostgreSQL client with WebSocket support
- `drizzle-orm` - TypeScript ORM with schema management
- `drizzle-kit` - Database migration tooling
- `express` - Web server framework
- `passport` / `passport-local` - Authentication framework
- `bcryptjs` - Password hashing
- `express-session` / `connect-pg-simple` - Session management with PostgreSQL store

**UI & Components:**
- `@radix-ui/*` - Headless UI component primitives (20+ components)
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant management
- `lucide-react` - Icon library
- `cmdk` - Command palette component
- `react-day-picker` - Date picker
- `react-input-mask` - Masked input fields
- `usa-states` - US state selection data

**Form & Validation:**
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Integration between react-hook-form and Zod

**Developer Tools:**
- `@replit/vite-plugin-*` - Replit-specific development plugins
- `tsx` - TypeScript execution for development
- `esbuild` - Fast bundler for production builds
- `ws` - WebSocket support for Neon connections

**Notable Architectural Choices:**
- No traditional REST framework - custom Express route handlers
- Session-based auth instead of JWT (better for server-rendered scenarios)
- Drizzle ORM over Prisma (lighter weight, more SQL-like)
- Neon serverless over traditional PostgreSQL (autoscaling, WebSocket support)
- Wouter over React Router (smaller bundle size)
- shadcn/ui over component libraries (full customization control)