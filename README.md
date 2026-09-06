# Rankora — Enterprise Order Operations & Financial Settlement Platform

A high-performance, full-stack MERN operations platform designed with multi-role workspaces for **Executive Operations**, **Mediator Network**, and **Brand Partners**.

---

## 🌟 Key Features & Role Portals

1. **Role Selection Portal (`/role-selection`)**:
   - Modern Obsidian mesh canvas with 3D glassmorphic role cards for Executive, Mediator, and Brand.
2. **Executive Command Workspace (`/panel-executive`)**:
   - Master order creation, multi-unit distribution to mediators.
   - Advance payment dispatch with proof upload and click-to-zoom lightboxes.
   - Mediator refund verification and one-click reconciliation back to pending.
   - Two-way directional balance transfers with transaction logs.
3. **Mediator Workspace (`/panel-mediator`)**:
   - Executive-wise grouped order review with quantity steppers and dynamic totals.
   - In-progress tracking, order placement submission (Order ID, Reviewer, Screenshots).
   - Post-delivery review, invoice, and seller feedback verification.
   - Live financial earnings spreadsheet with interactive net calculations.
4. **Brand Command Center (`/panel-brand`)**:
   - Executive brand campaign tracking with 5 real-time KPI metrics.
   - Multi-segment pipeline visualizer for every order batch.
   - Search & quick status filter toolbar.

---

## 🏗️ Architecture & Modular Styling

All CSS styles are strictly decoupled into dedicated stylesheets in `client/src/styles/`:
- `theme.css`: Design system tokens, typography (`Outfit`, `Plus Jakarta Sans`), animations.
- `roleSelection.css`: Atmospheric mesh and glassmorphism styling for role selection.
- `brandDashboard.css`: Luxury KPI metrics, search toolbar, and progress visualizers.
- `ordersTable.css`: Universal data tables, badges, modals, steppers, and lightboxes.
- `orderForm.css`: Card forms for order placement and refund proofs.
- `displayOrder.css`: Master order inspector and unit breakdowns.
- `dashboard.css`, `orderSummary.css`, `earningTable.css`, `detailedOrders.css`, `balance.css`.

---

## 🚀 Deployment Guide

### Option 1: Automated Full-Stack Deployment on Render (Recommended)
This repository includes a [`render.yaml`](./render.yaml) Blueprint that configures both the backend API and frontend client automatically.

1. Go to **[dashboard.render.com](https://dashboard.render.com/)**.
2. Click **New +** → **Blueprint**.
3. Select your repository: `shubham6401/Rankora`.
4. Render will automatically detect `render.yaml` and set up:
   - **`rankora-api`** (Node.js Web Service from `/server`)
   - **`rankora-frontend`** (Static Site from `/client`)
5. Fill in the prompted secret environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
   - `CLOUDINARY_API_KEY`: Cloudinary API key.
   - `CLOUDINARY_API_SECRET`: Cloudinary API secret.
6. Click **Apply** to deploy both services with one click!

---

### Option 2: Deploy Frontend on Vercel + Backend on Render

#### A. Frontend on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Import repository `shubham6401/Rankora`.
3. Configure project:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: Your backend API URL (e.g. `https://rankora-api.onrender.com/api`).
5. Click **Deploy**. (SPA routing is pre-configured in `client/vercel.json`).

#### B. Backend on Render
1. Click **New +** → **Web Service**.
2. Connect `shubham6401/Rankora`.
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
4. Environment Variables:
   - `PORT`: `8000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `your_mongodb_connection_string`
   - `JWT_SECRET`: `your_jwt_secret`
   - `CLOUDINARY_CLOUD_NAME`: `your_cloud_name`
   - `CLOUDINARY_API_KEY`: `your_api_key`
   - `CLOUDINARY_API_SECRET`: `your_api_secret`
5. Click **Deploy Web Service**.

---

## 💻 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/shubham6401/Rankora.git
cd Rankora
```

### 2. Backend Setup
```bash
cd server
npm install
# Create server/.env based on server/.env.example
npm start
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

### 4. Run Automated Tests
```bash
cd ../server
node test_backend.js
```
*(All 29 test suites pass with 100% success)*
