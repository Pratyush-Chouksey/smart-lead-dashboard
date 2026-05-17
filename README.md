<div align="center">

# 🚀 GigFlow – Smart Leads Dashboard

**A full-stack MERN Lead Management System with JWT auth, role-based access, and a polished dark-mode UI.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [A) Without Docker (Manual Setup)](#a-without-docker-manual-setup)
  - [B) With Docker Compose](#b-with-docker-compose)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🧠 About The Project

GigFlow Smart Leads Dashboard is a production-ready MERN application for managing sales leads end-to-end. It features secure JWT-based authentication with granular role-based access control, allowing admins to oversee all leads while sales reps manage their own. The interface ships with full dark mode support, advanced filtering, debounced search, CSV export, and a clean, responsive design built with Tailwind CSS v4.

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 🔐 | **JWT Authentication** | Secure register & login with `Bearer` token auth |
| 🛡️ | **Role-Based Access Control** | `admin` (full access) vs `sales` (own leads only) |
| 📋 | **Complete Lead CRUD** | Create, read, update, and delete leads |
| 🔍 | **Advanced Filtering** | Filter by Status, Source, and free-text search |
| ⚡ | **Debounced Search** | 500ms debounce to prevent excessive API calls |
| 📄 | **Pagination** | Server-side pagination, 10 leads per page |
| 📥 | **CSV Export** | Download filtered leads as a `.csv` file |
| 🌙 | **Dark Mode** | System-preference aware, persisted to `localStorage` |
| 📱 | **Responsive Design** | Mobile-first layout, works on all screen sizes |
| 🐳 | **Docker Support** | One-command startup with `docker compose up` |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev) | 18 | UI framework |
| [TypeScript](https://www.typescriptlang.org) | 5 | Type safety |
| [Vite](https://vitejs.dev) | 5 | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utility-first styling |
| [React Router](https://reactrouter.com) | 6 | Client-side routing |
| [TanStack Query](https://tanstack.com/query) | 5 | Server state & caching |
| [React Hook Form](https://react-hook-form.com) | 7 | Form management |
| [Zod](https://zod.dev) | 3 | Schema validation |
| [Axios](https://axios-http.com) | 1 | HTTP client |
| [Lucide React](https://lucide.dev) | latest | Icon library |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| [Node.js](https://nodejs.org) | 18+ | Runtime |
| [Express](https://expressjs.com) | 4 | Web framework |
| [TypeScript](https://www.typescriptlang.org) | 5 | Type safety |
| [Mongoose](https://mongoosejs.com) | 8 | MongoDB ODM |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9 | JWT signing & verification |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2 | Password hashing |
| [cors](https://github.com/expressjs/cors) | 2 | Cross-origin requests |

### Database & DevOps

| Technology | Purpose |
|------------|---------|
| [MongoDB](https://www.mongodb.com) | Primary database (Atlas or local) |
| [Docker](https://www.docker.com) | Containerisation |
| [Docker Compose](https://docs.docker.com/compose) | Multi-service orchestration |

---

## 📁 Project Structure

```
smart-leads-dashboard/
├── 📄 docker-compose.yml        # Compose: backend + MongoDB
├── 📄 Dockerfile                # Multi-stage backend image
├── 📄 .env.example              # Root env template
│
├── 🖥️  backend/
│   ├── index.ts                 # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                     # Backend environment variables
│   └── src/
│       ├── config/
│       │   └── db.ts            # Mongoose connection
│       ├── controllers/
│       │   ├── authController.ts
│       │   └── leadsController.ts
│       ├── middleware/
│       │   ├── authMiddleware.ts # JWT protect + adminOnly guards
│       │   └── errorMiddleware.ts # Global error handler & AppError
│       ├── models/
│       │   ├── User.ts
│       │   └── Lead.ts
│       ├── routes/
│       │   ├── authRoutes.ts
│       │   └── leadsRoutes.ts
│       ├── types/
│       │   └── index.ts         # Shared TS interfaces
│       └── utils/
│           └── generateToken.ts
│
└── 🎨 frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    ├── .env                     # Frontend environment variables
    └── src/
        ├── App.tsx              # Routes + public/protected guards
        ├── main.tsx             # Root render + FOUC prevention
        ├── index.css            # Tailwind v4 + design tokens
        ├── api/
        │   ├── auth.ts          # Register & login API calls
        │   ├── leads.ts         # Leads CRUD + CSV export
        │   └── axiosInstance.ts # Axios config + interceptors
        ├── components/
        │   ├── Navbar.tsx
        │   ├── LeadModal.tsx    # Add/Edit modal
        │   ├── LeadForm.tsx     # Shared lead form
        │   ├── Modal.tsx        # Generic modal wrapper
        │   ├── Table.tsx        # Sortable data table
        │   ├── Pagination.tsx
        │   ├── LoadingSkeleton.tsx
        │   ├── Badge.tsx
        │   ├── EmptyState.tsx
        │   ├── ProtectedRoute.tsx
        │   └── ErrorBoundary.tsx
        ├── context/
        │   ├── AuthContext.tsx   # JWT + user state
        │   └── DarkModeContext.tsx
        ├── hooks/
        │   ├── useDarkMode.ts
        │   └── useDebounce.ts
        ├── pages/
        │   ├── Dashboard.tsx    # Main leads table + filters
        │   ├── LeadDetail.tsx   # Single lead view
        │   ├── Login.tsx
        │   └── Register.tsx
        ├── types/
        │   └── index.ts
        └── utils/
```

---

## ✅ Prerequisites

Make sure the following are installed on your machine:

- **[Node.js](https://nodejs.org) ≥ 18** — `node -v`
- **[npm](https://npmjs.com) ≥ 9** — `npm -v`
- **[MongoDB](https://www.mongodb.com)** — local installation **or** a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- **[Docker](https://www.docker.com)** *(optional)* — only needed for the Compose workflow

---

## 🚀 Getting Started

### A) Without Docker (Manual Setup)

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/smart-leads-dashboard.git
cd smart-leads-dashboard
```

#### 2. Set up the Backend

```bash
cd backend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
# → Edit .env with your MONGO_URI and JWT_SECRET

# Start the dev server (port 8000)
npm run dev
```

#### 3. Set up the Frontend

Open a **second terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
# → VITE_API_URL and VITE_API_TARGET should already be correct for local dev

# Start the Vite dev server (port 5173)
npm run dev
```

#### 4. Open the app

```
http://localhost:5173
```

---

### B) With Docker Compose

> **Prerequisites:** Docker Desktop running.

```bash
# Clone the repo
git clone https://github.com/your-username/smart-leads-dashboard.git
cd smart-leads-dashboard

# Create the backend .env from the example
cp .env.example .env
# → Set JWT_SECRET (MONGO_URI is overridden by Compose automatically)

# Build images and start all services
docker compose up --build

# To run in detached (background) mode
docker compose up --build -d

# Stop all services
docker compose down

# Stop and remove volumes (wipes database data)
docker compose down -v
```

The backend API will be available at `http://localhost:8000`.

> **Note:** The frontend is not containerised in the Compose setup. Run it separately with `npm run dev` inside `frontend/`, pointing `VITE_API_TARGET=http://localhost:8000`.

---

## 🔑 Environment Variables

### Backend — `backend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8000` | Express server port |
| `MONGO_URI` | ✅ | — | Full MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | ✅ | — | Secret key for signing JWTs (min. 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiry duration (e.g. `1d`, `7d`, `30d`) |
| `NODE_ENV` | No | `development` | `development` \| `production` |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin |

**Example `backend/.env`:**
```env
PORT=8000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/smart-leads
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

### Frontend — `frontend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `/api` | Base URL for Axios (proxied by Vite in dev) |
| `VITE_API_TARGET` | No | `http://localhost:8000` | Vite proxy target (backend URL) |

**Example `frontend/.env`:**
```env
VITE_API_URL=/api
VITE_API_TARGET=http://localhost:8000
```

---

## 📡 API Documentation

All endpoints are prefixed with `/api`.

### 🔐 Auth Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/auth/register` | ❌ Public | — | Register a new user (`name`, `email`, `password`, `role`) |
| `POST` | `/api/auth/login` | ❌ Public | — | Login and receive a JWT token |
| `GET` | `/api/auth/me` | ✅ Bearer | Any | Get the currently authenticated user's profile |

### 📋 Leads Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/leads` | ✅ Bearer | Any | List leads with filtering, search & pagination |
| `POST` | `/api/leads` | ✅ Bearer | Any | Create a new lead |
| `GET` | `/api/leads/export` | ✅ Bearer | Any | Download filtered leads as a CSV file |
| `GET` | `/api/leads/:id` | ✅ Bearer | Any | Get a single lead by ID |
| `PUT` | `/api/leads/:id` | ✅ Bearer | Any | Update a lead (sales: own leads only) |
| `DELETE` | `/api/leads/:id` | ✅ Bearer | **Admin** | Delete a lead (admin only) |

### Query Parameters for `GET /api/leads`

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `search` | `string` | `john` | Full-text search on name & email |
| `status` | `string` | `Qualified` | Filter by status: `New` \| `Contacted` \| `Qualified` \| `Lost` |
| `source` | `string` | `Website` | Filter by source: `Website` \| `Instagram` \| `Referral` |
| `sort` | `string` | `latest` | Sort order: `latest` \| `oldest` |
| `page` | `number` | `2` | Page number (default: `1`) |
| `limit` | `number` | `10` | Results per page (default: `10`) |

### Response Shape

All endpoints return a consistent JSON envelope:

```jsonc
// Success
{
  "success": true,
  "message": "Operation message",
  "data": { /* payload */ }
}

// Error
{
  "success": false,
  "message": "Error description"
}
```

---

## 📸 Screenshots

> Screenshots will be added after the first public deployment.

| View | Preview |
|------|---------|
| 🌙 Dashboard (Dark Mode) | *(coming soon)* |
| ☀️ Dashboard (Light Mode) | *(coming soon)* |
| 🔐 Login Page | *(coming soon)* |
| 📋 Lead Detail | *(coming soon)* |
| ➕ Add / Edit Modal | *(coming soon)* |

---

## 🌐 Deployment

### Backend — [Render](https://render.com)

1. Push your code to a GitHub repository.
2. Create a new **Web Service** on Render, connect your repo.
3. Set **Root Directory** → `backend`
4. Set **Build Command** → `npm install && npm run build`
5. Set **Start Command** → `npm start`
6. Add all [backend environment variables](#backend--backendenv) in the Render dashboard.

### Frontend — [Vercel](https://vercel.com)

1. Import your GitHub repository on Vercel.
2. Set **Root Directory** → `frontend`
3. Set **Build Command** → `npm run build`
4. Set **Output Directory** → `dist`
5. Add environment variables:
   - `VITE_API_URL` → `https://your-render-app.onrender.com/api`
6. Click **Deploy**.

> **CORS:** After deploying the frontend, update `CORS_ORIGIN` in the backend environment to match your Vercel production URL (e.g. `https://smart-leads.vercel.app`).

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Made with ❤️ by **Pratyush Chouksey**

⭐ Star this repo if you found it helpful!

</div>
