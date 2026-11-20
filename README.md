# GymFlow

GymFlow is a multi-tenant gym operations platform with separate Super Admin, Gym Owner, and Member experiences. The API uses MongoDB through Mongoose. Tenant identifiers are taken from the authenticated account, never from a client-supplied gym ID.

## Project structure

```text
backend/
  database/       seed scripts and index management
  src/
    config/       MongoDB connection
    controllers/  request handlers
    middleware/   authentication, validation, and errors
    models/       one Mongoose model per domain collection
    routes/       versioned role-specific API routes
    services/     business operations and audit logging
    utils/        shared HTTP and response helpers
frontend/
  src/
    components/   shared UI, authentication, and forms
    layouts/      authenticated application shell
    lib/          API client
    pages/        dashboard and feature screens
```

## Requirements

- Node.js 20.19+ (Vite 8 requirement)
- MongoDB 7+ locally, or a MongoDB Atlas cluster

## Local development

You can run a loopback-only development MongoDB instance using Docker Compose:

```powershell
docker compose up -d mongodb
```

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGODB_URI` to your local MongoDB or Atlas connection string. A local `mongod` must be running; Atlas works if no local MongoDB is installed.
3. Generate a unique access secret and place it in `JWT_ACCESS_SECRET`. For example:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. For a local standalone MongoDB instance, keep `MONGODB_TRANSACTIONS=false`. For MongoDB Atlas or a replica set, set it to `true`. Production requires transactions for multi-document account and payment writes.

5. Install and start the API:

   ```powershell
   cd backend
   npm install
   npm run db:indexes
   npm start
   ```

6. Copy `frontend/.env.example` to `frontend/.env`, then start the client:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

The client runs at `http://localhost:5173` and the API at `http://localhost:5000`. The API health endpoint is `/`.

## Initial accounts and development seed

Create a Super Admin using an out-of-band command. Owner registration is not public:

```powershell
cd backend
npm run seed:admin -- admin@example.com "Use-A-Unique-Password-12"
```

To load three development gyms, owners, memberships, payments, attendance, trainers, workout plans, and announcements:

```powershell
cd backend
npm run seed
```

Development owner login: `owner1@example.test` / `GymFlowDev123!`.

Never load seed data or use development credentials in production.

## API domains

- `/api/v1/auth`: login, activation, logout, current account
- `/api/v1/admin`: platform overview, gyms, owners, platform plans, activity
- `/api/v1/owner`: gym dashboard, members, membership plans, payments, attendance, trainers, announcements, reports
- `/api/v1/member`: personal dashboard, profile, membership, payments, attendance, workouts, fitness progress, notifications

All gym-scoped records are queried using the authenticated user's `gymId`. Owner and member routes enforce role checks. Passwords are bcrypt-hashed, access tokens are short-lived HttpOnly cookies, activation tokens are stored as hashes, and sign-in is rate-limited with temporary lockout.

## Environment

Backend variables are documented in `backend/.env.example`; frontend variables are in `frontend/.env.example`. Production must use a managed replica-set MongoDB deployment, `MONGODB_TRANSACTIONS=true`, a strong unique JWT secret, HTTPS, a restricted `FRONTEND_URL`, and automated backups. SMTP settings are optional and are not required for local manual activation links.

For production, build indexes before serving traffic:

```powershell
cd backend
npm run db:indexes
```

## Checks

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm run lint
npm run build
```

No automatic MySQL-to-MongoDB data migration is included. The previous database schema was not a MongoDB schema; export and transform any existing records before switching a production deployment.

## Deployment

- **Vercel:** deploy `frontend` as a Vite application and set `VITE_API_URL` to the HTTPS API URL.
- **Render:** deploy `backend` as a Node service with `npm start`; set the variables in `backend/.env.example`, MongoDB Atlas URI, and the Vercel origin in `FRONTEND_URL`.
- Use TLS, database network restrictions, least-privilege database credentials, backups, and monitoring.
