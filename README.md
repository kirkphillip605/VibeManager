# VibeManager - DJ & Karaoke Business Management System

A comprehensive business management system for DJ and Karaoke entertainment businesses. Manage gigs, personnel, customers, venues, invoices, and more.

## Features

- **Gig Management**: Schedule, track, and manage all your events
- **Personnel Tracking**: Manage DJs, staff assignments, check-ins, and payouts
- **Customer Database**: Keep detailed records of customers and their events
- **Venue Management**: Track venue information and relationships
- **Invoice System**: Create and manage invoices for gigs
- **File Management**: Store and organize contracts, agreements, and documents
- **Calendar View**: Visualize all events in an interactive calendar
- **Analytics Dashboard**: Track revenue, performance metrics, and insights
- **Role-Based Access**: Different views for owners, managers, and personnel

## Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database (local or hosted like Neon, Supabase, etc.)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kirkphillip605/VibeManager.git
   cd VibeManager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual values
   # IMPORTANT: Generate a secure SESSION_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Configure your database**
   
   Edit the `.env` file and set your `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

5. **Set up the database schema**
   ```bash
   # Push the schema to your database
   npm run db:push
   
   # Or generate and run migrations
   npm run db:generate
   npm run db:migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   
   Open your browser to `http://localhost:5000`

## Environment Variables

The application requires the following environment variables. See `.env.example` for a complete template.

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://user:pass@localhost:5432/vibemanager`

- `SESSION_SECRET`: Secure random string (minimum 32 characters)
  - Used for session encryption
  - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Optional Variables

- `PORT`: Application server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)
- `APP_DOMAIN`: Your application domain (e.g., https://yourdomain.com)

### Docker-Specific Variables

When using Docker Compose, these additional variables configure the PostgreSQL container:

- `POSTGRES_USER`: Database username (default: vibemanager)
- `POSTGRES_PASSWORD`: Database password (default: vibemanager)
- `POSTGRES_DB`: Database name (default: vibemanager)

## Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run check` - Run TypeScript type checking
- `npm run build` - Build for production
- `npm start` - Start production server

### Database Management

- `npm run db:generate` - Generate migration files from schema
- `npm run db:migrate` - Run pending migrations
- `npm run db:push` - Push schema directly to database (development)
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run db:introspect` - Introspect existing database schema

### Docker Deployment

- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run docker:dev` - Start with Docker Compose (includes PostgreSQL)
- `npm run docker:down` - Stop Docker Compose services

### PM2 Process Management

- `npm run pm2:start` - Start with PM2 process manager
- `npm run pm2:stop` - Stop PM2 processes
- `npm run pm2:restart` - Restart application
- `npm run pm2:logs` - View application logs
- `npm run pm2:delete` - Remove from PM2

## Production Deployment

For detailed production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Production Setup

1. **Build the application**
   ```bash
   npm install
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your_production_db_url
   export SESSION_SECRET=your_secure_secret
   export APP_DOMAIN=https://yourdomain.com
   ```

3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

4. **Start the application**
   
   Option 1 - Direct Node.js:
   ```bash
   npm start
   ```
   
   Option 2 - With PM2:
   ```bash
   npm run pm2:start
   ```
   
   Option 3 - With Docker:
   ```bash
   npm run docker:build
   npm run docker:run
   ```

## User Roles

The application supports three user roles:

1. **Owner**: Full system access, settings management
2. **Manager**: Manage gigs, personnel, customers, venues
3. **Personnel**: View assigned gigs, check-in/out, view payouts

## Technology Stack

### Frontend
- React 18 with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Radix UI components
- Tailwind CSS for styling

### Backend
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- Passport.js for authentication
- Express Session with PostgreSQL store

### Build Tools
- Vite for frontend bundling
- esbuild for backend bundling
- TypeScript for type safety

## Project Structure

```
VibeManager/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
│   └── public/            # Static assets
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication logic
│   ├── storage.ts        # Database operations
│   └── db.ts             # Database connection
├── shared/               # Shared types and schema
│   └── schema.ts         # Database schema definitions
├── migrations/           # Database migrations
├── .env.example          # Environment variables template
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── ecosystem.config.js   # PM2 configuration
└── DEPLOYMENT.md         # Detailed deployment guide
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts and authentication
- **personnel**: Staff/DJ information
- **customers**: Client database
- **venues**: Event locations
- **contacts**: Contact information for customers/venues
- **gigs**: Event/gig records
- **gig_personnel**: Staff assignments to gigs
- **gig_invoices**: Invoice records
- **gig_check_ins**: Personnel check-in/out tracking
- **files**: Document storage metadata
- Lookup tables: gig_types, personnel_types, venue_types, contact_roles, payment_methods, document_types

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Security

- Always use strong `SESSION_SECRET` values in production
- Keep your `.env` file secure and never commit it to version control
- Use HTTPS in production environments
- Regularly update dependencies for security patches
- Follow the principle of least privilege for database users
- Implement rate limiting and other security measures for production deployments

## Acknowledgments

- Built with modern React and Node.js technologies
- Uses Radix UI for accessible component primitives
- Powered by Drizzle ORM for type-safe database operations
