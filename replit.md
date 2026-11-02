# NPT - Norfolk Poker Tour Registration Platform

## Overview

This is a modern web application for the Norfolk Poker Tour (NPT), allowing users to browse upcoming tournaments and register online. The platform features a premium poker aesthetic with dark mode theming, real-time tournament availability tracking, and a streamlined registration flow. Built with React and Express, it provides an engaging user experience for tournament discovery and seat reservation.

**Key Features:**
- Tournament browsing and registration
- Notification signup for future tournament announcements
- Real-time seat availability tracking
- Waitlist and "maybe attending" registration options
- NPT branded poker aesthetic
- Complete admin system for tournament and rules management
- Chip structure and blind schedule management
- Secure authentication for admin users

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 23, 2025 - CASCADE Deletion for Tournaments**
- Implemented CASCADE deletion in database: when a tournament is deleted, all associated data is automatically removed
- Deleting a tournament now automatically removes all registrations for that tournament
- Deleting a tournament now automatically removes all results/placements for that tournament  
- Prevents orphaned data from accumulating in the database
- Added foreign key constraints with ON DELETE CASCADE to registrations and tournament_results tables

**November 23, 2025 - Tournament Placement Badges in Details**
- Added placement badges in tournament detail dialogs showing players' finishing positions
- Public API endpoint GET `/api/tournament-results/:tournamentId` returns placement data
- Badges appear next to player names in registered players list (confirmed, waitlist, maybe)
- Visual indicators: 👑 1st, 🥈 2nd, 🥉 3rd, numbered emojis for 4th-6th, text for 7th+
- Placement badges only show for players who have results entered in admin panel
- Badges use `justify-between` layout to appear on the right side of player cards

**November 23, 2025 - Past Tournament Toggle Button**
- Added "Show Past Tournaments" button on homepage to toggle visibility of past tournaments
- By default, past tournaments are hidden from the main view
- Clicking the button shows all tournaments (past and future) and changes title to "All Tournaments"
- Button text updates dynamically: "Show Past Tournaments" ↔ "Hide Past Tournaments"
- Improved cache management: tournament create/delete operations now refetch data to ensure immediate updates
- Toggle works alongside existing search and format filters

**November 13, 2025 - Google Calendar Integration**
- Added "Add to Google Calendar" button to tournament detail dialogs
- Users can add tournaments to their calendar with one click
- Calendar events include tournament name, date, time, format, buy-in, prize pool, and location
- Events default to 4-hour duration (typical poker tournament length)
- Registration success messages now remind users to add events to their calendar
- Universal format works with Google Calendar, Apple Calendar, Outlook, and other calendar apps

**November 13, 2025 - Registration Form Bug Fix**
- Fixed critical bug where radio button selections weren't being submitted correctly
- Users selecting "Confirmed" were incorrectly registered as "Maybe Attending"
- Changed RadioGroup from `defaultValue` to `value` for proper form control
- All new registrations now correctly reflect user's selected registration type

**November 8, 2025 - Admin Registration Management**
- Added ability for admins to edit registration statuses directly from Tournament Registrations page
- Added ability for admins to delete player registrations with confirmation dialog
- Each registration has a dropdown to change status between Confirmed, Waitlist, and Maybe
- Delete button (trash icon) appears next to each registration's status dropdown
- Implemented transactional updates with SELECT FOR UPDATE to prevent race conditions
- Tournament confirmed counts update atomically when moving players between statuses or deleting
- Admin API endpoints: PUT /api/admin/registrations/:id, DELETE /api/admin/registrations/:id

**November 1, 2025 - Registered Players Display**
- Added public API endpoint to view registered player names for each tournament
- Tournament detail dialog now shows all registered players organized by status (confirmed, waitlist, maybe)
- Privacy-protected: only player names are shown publicly (emails and phone numbers remain admin-only)
- Player list updates in real-time after new registrations

**October 31, 2025 - Chip Structure Integration (Complete)**
- Added `breakFrequency` and `breakDurationMinutes` columns to `chip_structure` table
- Implemented global chip structure system - all new tournaments automatically use chip structure defaults
- Tournament forms now fetch and pre-populate with chip structure values (blinds, rebuys, addons, etc.)
- Admins can edit chip structure in one place, and all future tournaments will use those settings
- Fixed tournament edit form to show tournament's actual saved values instead of chip structure defaults
- Fixed tournament edit form number input fields to properly maintain values using explicit `value={field.value}`
- Fixed cache invalidation on tournament updates - both list and individual tournament queries now refresh
- Users can now edit tournaments and change single fields without re-entering all data

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (single-page application)

**UI Component System**
- Shadcn/ui components with Radix UI primitives for accessible, unstyled foundations
- Tailwind CSS for utility-first styling with custom design tokens
- Dark mode-first design with poker table aesthetic (deep charcoal backgrounds, green accents)
- Typography using Inter and Outfit font families for modern, competitive feel

**State Management**
- TanStack Query (React Query) for server state management and caching
- Local component state with React hooks for UI-specific state
- Form state managed by React Hook Form with Zod validation

**Design System**
- Custom color palette defined in CSS variables supporting light/dark modes
- Poker-themed colors: poker table green (primary), tournament red (accent)
- Elevation system using hover and active states for interactive elements
- Consistent spacing using Tailwind's scale (2, 4, 6, 8, 12, 16, 20)

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and API routing
- TypeScript for type safety across the full stack
- Custom middleware for request logging and error handling

**API Design**
- RESTful endpoints for tournament and registration resources

**Public Endpoints:**
- GET `/api/tournaments` - Retrieve all tournaments
- GET `/api/registrations/:tournamentId` - Get registered player names for a tournament (privacy-protected)
- POST `/api/registrations` - Create new tournament registration
- POST `/api/notifications` - Subscribe to tournament notifications
- GET `/api/rules` - Get tournament rules and guidelines
- GET `/api/chip-structure` - Get chip structure and blind schedule

**Admin Endpoints (Authentication Required):**
- POST `/api/auth/login` - Admin login
- POST `/api/auth/logout` - Admin logout
- GET `/api/auth/session` - Check admin session
- POST `/api/admin/tournaments` - Create new tournament
- PUT `/api/admin/tournaments/:id` - Update tournament
- DELETE `/api/admin/tournaments/:id` - Delete tournament
- PUT `/api/admin/rules` - Update tournament rules
- PUT `/api/admin/chip-structure` - Update chip structure and blind schedule
- GET `/api/admin/users` - List all admin users
- POST `/api/admin/users` - Create new admin user
- GET `/api/admin/registrations/:tournamentId` - Get all registrations for a tournament (full details)
- PUT `/api/admin/registrations/:id` - Update registration status (confirmed/waitlist/maybe)
- DELETE `/api/admin/registrations/:id` - Delete a player registration

- JSON request/response format with structured error handling

**Data Validation**
- Zod schemas for runtime validation of API payloads
- Shared schema definitions between client and server via `@shared` directory
- Email and phone number validation on registration forms

### Data Storage

**Current Implementation** (Updated October 31, 2025)
- PostgreSQL database storage (`DatabaseStorage` class) for persistent data
- Drizzle ORM for type-safe database queries
- Automatic seeding of initial data on first launch
- Interface-based storage abstraction (`IStorage`) allows switching between storage implementations
- Data persists across server restarts and deployments

**Database Schema (Drizzle ORM)**
- `tournaments` table: Stores tournament details (name, format, date, buy-in, prize pool, seat capacity, rebuy/addon pricing)
  - Each tournament has individual rebuy amount, rebuy chips, addon amount, and addon chips
  - Allows for different rebuy/addon structures per tournament
- `registrations` table: Stores player registrations (tournament ID, name, email, phone, registration type)
- `notification_subscribers` table: Stores email/phone for tournament notifications
- `admin_users` table: Stores admin credentials with bcrypt-hashed passwords
- `tournament_rules` table: Stores dynamic tournament rules as JSON sections
- `chip_structure` table: Stores chip structure data including:
  - Starting stack, blinds, and blind level duration (40 minutes)
  - Break frequency and duration (15-minute breaks every 3 levels)
  - Rebuy/addon information (global defaults)
  - Blind schedule as JSON array
- PostgreSQL dialect configured with Neon serverless driver
- UUID primary keys generated via `gen_random_uuid()`
- Date fields use `z.coerce.date()` for JSON serialization compatibility

**Migration Strategy**
- Drizzle Kit for schema migrations
- Schema definitions in `shared/schema.ts` for type safety
- Push-based migrations via `npm run db:push`

### Authentication & Authorization

**Current State**
- Session-based authentication with Passport.js and local strategy
- Bcrypt password hashing for secure credential storage
- HTTP-only session cookies for security
- Protected admin routes with authentication middleware
- Default admin account: mike@bleacherrentals.com / Mt123132 (seeded on startup)

**Implementation Details**
- Express-session with PostgreSQL session store (connect-pg-simple) for production persistence
- Session secret stored as SESSION_SECRET environment variable
- Sessions stored in PostgreSQL database for reliability across restarts and multiple instances
- requireAuth middleware protects all admin API routes
- Admin users can create, edit, and delete tournaments
- Admin users can edit tournament rules
- Admin users can create additional admin accounts for other staff members
- Email uniqueness is enforced for admin accounts (case-insensitive)
- Password hashes are never exposed to clients (sanitized in responses)

**Future Considerations**
- Player user accounts for registration history tracking
- Multi-factor authentication for enhanced admin security

## External Dependencies

### Core Libraries
- **@tanstack/react-query** - Server state management and data fetching
- **drizzle-orm** - Type-safe SQL query builder and ORM
- **@neondatabase/serverless** - PostgreSQL client for Neon serverless database
- **express** - Web application framework for Node.js
- **zod** - Schema validation for TypeScript

### UI Component Libraries
- **@radix-ui/** (multiple packages) - Unstyled, accessible UI primitives
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant management
- **lucide-react** - Icon library

### Form Management
- **react-hook-form** - Performant form state management
- **@hookform/resolvers** - Validation resolver integration
- **drizzle-zod** - Zod schema generation from Drizzle schemas

### Development Tools
- **vite** - Frontend build tool and dev server
- **typescript** - Static type checking
- **tsx** - TypeScript execution for Node.js
- **esbuild** - Fast JavaScript bundler for production builds

### Additional Utilities
- **date-fns** - Date formatting and manipulation
- **wouter** - Lightweight routing library
- **cmdk** - Command menu component
- **embla-carousel-react** - Carousel/slider component

### Database & Migrations
- **drizzle-kit** - Database migration toolkit
- **connect-pg-simple** - PostgreSQL session store for Express sessions