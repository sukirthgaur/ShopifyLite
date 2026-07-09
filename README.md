# Shopify Lite — MVP

Shopify Lite is a multi-tenant e-commerce platform MVP built with Express + TypeScript + Prisma on the backend and React + TypeScript + Vite + Tailwind CSS on the frontend.

## Tech Stack
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT Authentication, Zod Schema Validation
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Axios, React Router 7

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v15+)

### Database & Environment Setup

1. **Backend Configuration**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://bot@localhost:5432/shopify_lite
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

2. **Frontend Configuration**:
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Install Dependencies**:
   Install root, backend, and frontend dependencies:
   ```bash
   # From the root directory:
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Run Migrations & Seed**:
   Initialize database tables and seed sample data:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run db:seed
   ```

### Running the Application

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   The backend server runs on `http://localhost:5000`.

2. **Start Frontend Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend application is accessible at `http://localhost:5173`.

## Default Credentials

### Super Admin
- **Email**: `superadmin@shopifylite.com`
- **Password**: `SuperAdmin123!`

### Demo Store Alpha Admin
- **Email**: `alpha@demo.com`
- **Password**: `StoreAdmin123!`

### Demo Store Beta Admin
- **Email**: `beta@demo.com`
- **Password**: `StoreAdmin123!`
