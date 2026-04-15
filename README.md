# CLG ERP (MERN)

A production-minded MERN starter for a phased College ERP rollout.



Checkout live at- https://clg-erp-sdsf.pages.dev/


free credentials to use->
## ADMIN
admin@clg.edu
password:Admin@12345

## Faculty
neha.gupta@clg.edu
password:Faculty@12345

#Student
rohan.verma@clg.edu
password:Student@12345

## Tech Stack

- MongoDB
- Express (Node.js)
- React + Vite + TypeScript
- Docker + Nginx (frontend static serving)

## Project Structure

- `apps/server` - Express API
- `apps/client` - React frontend
- `docs/phases.md` - phased delivery plan

## Phase 1 Scope Included

- Secure API foundation (`helmet`, CORS, rate-limits, structured logs)
- JWT authentication (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- React auth flow with protected route (`/dashboard`)
- Health endpoint (`/api/health`)
- Dockerized local/prod-like stack

## Run Locally

1. Create environment files:
   - `apps/server/.env` from `apps/server/.env.example`
   - `apps/client/.env` from `apps/client/.env.example`
2. Install dependencies:
   - `npm install` (root)
   - `npm --prefix apps/server install`
   - `npm --prefix apps/client install`
3. Start MongoDB locally (or use Docker compose).
4. Start app in dev mode:
   - `npm run dev`

## Docker Compose

- `docker compose up --build`

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- MongoDB: `mongodb://localhost:27017`

## Docker Deployment Steps

1. Copy the environment templates:
   - `copy .env.example .env`
   - `copy apps\server\.env.example apps\server\.env`
2. Edit `apps/server/.env` and set:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI` to your production MongoDB connection string
   - `JWT_ACCESS_SECRET` to a long random secret
   - `JWT_ACCESS_EXPIRES_IN` if you want a different token lifetime
   - `CORS_ORIGIN` to your frontend origin
3. Edit root `.env` and set compose deployment values:
   - `SERVER_PORT` (public backend port)
   - `CLIENT_PORT` (public frontend port)
   - `MONGO_URI` (container override, optional if defined in `apps/server/.env`)
   - `CORS_ORIGIN` (frontend origin)
   - `VITE_API_URL` (public backend API URL, e.g. `https://api.yourdomain.com/api`)
4. Start the stack from the repository root:
   - `docker compose up --build -d`
5. Verify the containers are running:
   - `docker compose ps`
6. Check backend health endpoints:
   - `Invoke-WebRequest -Uri 'http://localhost:5000/api/health/live' -UseBasicParsing | Select-Object -ExpandProperty Content`
   - `Invoke-WebRequest -Uri 'http://localhost:5000/api/health/ready' -UseBasicParsing | Select-Object -ExpandProperty Content`
7. Open the frontend in the browser:
   - `http://localhost:5173`
8. To follow logs:
   - `docker compose logs -f server`
   - `docker compose logs -f client`
9. To stop the deployment:
   - `docker compose down`

Production note:

- The current compose setup is suitable for local and single-server deployment.
- The compose file uses the bundled MongoDB service by default. If you want Atlas instead, change the server container's `MONGO_URI` override in `docker-compose.yml` before deploying.
- For a public production domain, put a reverse proxy in front of the containers and point `CORS_ORIGIN` plus `VITE_API_URL` to that domain.

## Deploy Backend Separately On Render

This repository includes a Render blueprint at [render.yaml](render.yaml) for the backend only.

1. Create a new Render Web Service from this repository using the blueprint.
2. Set the root directory to `apps/server` if you are creating the service manually.
3. Use the blueprint build and start commands:
   - Build: `npm ci`
   - Start: `npm start`
4. Add these environment variables in Render:
   - `MONGO_URI` pointing to MongoDB Atlas or another external MongoDB instance
   - `JWT_ACCESS_SECRET` with at least 32 random characters
   - `CORS_ORIGIN` with your frontend origin, or a comma-separated list of allowed origins
   - `JWT_ACCESS_EXPIRES_IN` if you want a token lifetime other than `1d`
5. Leave `PORT` unset in Render. Render injects it automatically.
6. Use `/api/health/ready` as the health check path.

If you deploy the frontend somewhere else later, update `CORS_ORIGIN` to that deployed frontend URL before testing login or authenticated requests.

### Deploy Both on One VM (quick recipe)

1. Install Docker and Docker Compose on the VM.
2. Clone this repository to the VM.
3. Configure `apps/server/.env` and root `.env` as shown above.
4. Run:
   - `npm run phase5:quick`
   - `docker compose up --build -d`
5. Open firewall ports for `SERVER_PORT` and `CLIENT_PORT` (or expose only reverse proxy ports 80/443).

## API Endpoints

- `GET /api/health`
- `GET /api/health/live`
- `GET /api/health/ready`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Phase 2 endpoints:

- `GET|POST /api/departments`
- `GET|PATCH|DELETE /api/departments/:id`
- `GET|POST /api/courses`
- `GET|PATCH|DELETE /api/courses/:id`
- `GET|POST /api/students`
- `GET|PATCH|DELETE /api/students/:id`

Phase 3 endpoints:

- `GET|POST /api/attendance`
- `GET|PATCH|DELETE /api/attendance/:id`
- `GET|POST /api/timetables`
- `GET|PATCH|DELETE /api/timetables/:id`
- `GET|POST /api/exams`
- `GET|PATCH|DELETE /api/exams/:id`
- `GET|POST /api/invoices`
- `GET|PATCH|DELETE /api/invoices/:id`

Phase 4 endpoints:

- `GET /api/reports/dashboard`
- `GET /api/reports/at-risk`
- `GET /api/reports/search`
- `GET /api/reports/export`

## Next Phases

Refer to `docs/phases.md` for the full implementation roadmap.

## Phase 5 Quick Pass

Quick hardening path (build + smoke checks):

- `npm run phase5:quick`

Or run individually:

- `npm run build`
- `npm run smoke`

Checklist details: `docs/phase5-quick.md`
