# Deployment Guide

This guide covers how to deploy the VibeManager application using different methods.

## Prerequisites

1. Node.js 20+ installed
2. PostgreSQL database (local or hosted)
3. Copy `.env.example` to `.env` and fill in the values

## Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
# IMPORTANT: Generate a secure SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure random string (min 32 characters)
- `PORT`: Application port (default: 5000)
- `NODE_ENV`: development or production
- `APP_DOMAIN`: Your application domain (e.g., https://yourdomain.com)

## Database Setup

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Open Drizzle Studio to view/edit data
npm run db:studio
```

## Deployment Options

### Option 1: Docker (Recommended)

#### Single Container

```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

#### Docker Compose (with PostgreSQL)

```bash
# Start all services (app + database)
npm run docker:dev

# Stop all services
npm run docker:down
```

The docker-compose setup includes:
- Application container
- PostgreSQL database container
- Automatic networking between services
- Persistent data volumes

### Option 2: PM2 (Node.js Process Manager)

PM2 is great for production deployments on VPS/dedicated servers.

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Build the application
npm run build

# Start with PM2
npm run pm2:start

# View logs
npm run pm2:logs

# Restart the application
npm run pm2:restart

# Stop the application
npm run pm2:stop

# Delete from PM2
npm run pm2:delete
```

PM2 features:
- Cluster mode (utilizes all CPU cores)
- Auto-restart on crashes
- Log management
- Memory limits
- Zero-downtime reloads

### Option 3: Traditional Node.js

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Type checking
npm run check
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate secure `SESSION_SECRET` (min 32 chars)
- [ ] Configure production `DATABASE_URL`
- [ ] Set correct `APP_DOMAIN`
- [ ] Run database migrations
- [ ] Build application (`npm run build`)
- [ ] Set up SSL/TLS certificate (use nginx/caddy as reverse proxy)
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure automated backups for database

## Reverse Proxy Setup (Nginx Example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Or on Windows
netstat -ano | findstr :5000

# Kill the process and restart
```

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure firewall allows database connections
- Test connection with `psql` or database client

### Session Issues
- Ensure `SESSION_SECRET` is at least 32 characters
- Check that database has `user_sessions` table
- Verify cookies are being set correctly

## Monitoring

### PM2 Monitoring
```bash
# View app status
pm2 status

# Monitor in real-time
pm2 monit

# View logs
pm2 logs vibemanager
```

### Docker Monitoring
```bash
# View container logs
docker logs -f vibemanager

# View container stats
docker stats
```

## Backup Strategy

### Database Backup
```bash
# Backup PostgreSQL database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240101.sql
```

## Updates and Maintenance

```bash
# Pull latest code
git pull

# Install any new dependencies
npm install

# Run migrations if schema changed
npm run db:migrate

# Rebuild application
npm run build

# Restart application
# For PM2:
npm run pm2:restart

# For Docker:
npm run docker:build
npm run docker:run
```
