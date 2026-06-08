# FreightAudit AI — Local Setup and Deployment Guide

Welcome to the **FreightAudit AI** setup guide! This document contains step-by-step instructions for installing all dependencies, configuring environment variables, setting up the local database schema, and launching the application in your local environment.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Dependency Requirements](#2-dependency-requirements)
3. [Environment Variables Configuration](#3-environment-variables-configuration)
4. [Supabase Setup (Database & Tables)](#4-supabase-setup-database--tables)
5. [Local Development Setup](#5-local-development-setup)
6. [Production Build & Startup](#6-production-build--startup)
7. [Architecture Overview](#7-architecture-overview)

---

## 1. Prerequisites

Before installing the application, make sure you have the following installed on your machine:
- **Node.js**: `v18.x` or `v20.x` (or higher)
- **npm**: `v9.x` or `v10.x` (packaged with Node.js) or **pnpm** / **yarn**
- **Supabase Account**: A cloud project on [supabase.com](https://supabase.com) OR a local Supabase CLI setup.
- **Anthropic API Key**: Access to the Claude API (`claude-haiku-3` is used by default for audits).
- **Resend API Key**: (Optional but recommended) For automated team invitation and dispute emails.

---

## 2. Dependency Requirements

Your `package.json` contains the following production and development dependencies. They will be auto-installed by running `npm install`.

### Production Dependencies (`dependencies`)
- **Framework & Compilation**: `react` (^19.0.1), `react-dom` (^19.0.1), `vite` (^6.2.3), `@tailwindcss/vite` (^4.1.14)
- **Server Side Backend**: `express` (^4.21.2)
- **Database / Client Integration**: `@supabase/supabase-js` (^2.107.0), `@supabase/ssr` (^0.10.3)
- **AI Integration Core**: `@anthropic-ai/sdk` (^0.101.0), `@google/genai` (^2.4.0)
- **Document & File Handling**: `pdf-parse` (^2.4.5), `multer` (^2.1.1), `react-dropzone` (^15.0.0)
- **Visuals & Charts**: `recharts` (^3.8.1), `lucide-react` (^0.546.0), `motion` (^12.23.24)
- **Utilities**: `date-fns` (^4.4.0), `dotenv` (^17.2.3)

### Development Dependencies (`devDependencies`)
- **TypeScript**: `typescript` (~5.8.2), `@types/node` (^22.14.0), `@types/express` (^4.17.21), `@types/multer` (^2.1.0)
- **Styles & Build Bundle**: `esbuild` (^0.25.0), `tailwindcss` (^4.1.14), `autoprefixer` (^10.4.21)
- **Type Execution**: `tsx` (^4.21.0) (executes TS files directly on Node.js)

---

## 3. Environment Variables Configuration

In the root of the project, create a file named `.env` and populate it with the appropriate values. You can copy the structure of `.env.example` as a starting point.

```bash
# Create your local .env file
cp .env.example .env
```

Define the following environment variables in `.env`:

```env
# URL of your locally hosted or deployed app
APP_URL="http://localhost:3000"

# Anthropic Claude API Key (Required for AI Invoice extraction & auditing)
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Resend API Key (Required for sending out carrier disputes & onboarding team invites)
RESEND_API_KEY="re_your_resend_api_key_here"

# Supabase Configurations
# Head to Settings -> API in your Supabase Dashboard to retrieve these keys
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Gemini AI API Key (Optional fallback)
GEMINI_API_KEY="your-gemini-api-key"
```

---

## 4. Supabase Setup (Database & Tables)

FreightAudit AI relies on structured databases, Relational Row Level Security (RLS), and database schemas. To create the tables locally:

1. Open your **Supabase Dashboard** (or access your local console).
2. Click on the **SQL Editor** tab from the left sidebar.
3. Click "New Query" to make a blank workspace.
4. Copy and paste the entire SQL structure located inside **`supabase/schema.sql`** into the editor.
5. Click **Run** to execute the database migration.

The schema script will safely build:
- **`organizations`** table (for defining business profiles)
- **`contracts`** table (for carrier custom SLA and base freight/ancillary rates rules)
- **`invoices`** table (for extracted carrier invoices)
- **`line_items`** table (for audited transport line items with AI compliance logs)
- **`disputes`** and **`org_members`** tables
- **Storage bucket declarations** (Recommended bucket name: `invoices`). Ensure public read access is enabled for the `invoices` bucket on Supabase Storage.

---

## 5. Local Development Setup

To boot up FreightAudit AI in local development mode, perform the following commands in order:

### Step 1: Install Dependencies
Run the installation command to populate the local `node_modules` directory:
```bash
npm install
```

### Step 2: Start Development Server
FreightAudit AI operates as a unified, full-stack application (Express API backend with dynamic Vite Hot Reload on the same port). Spin up the server:
```bash
npm run dev
```

The server should successfully bind and display:
```text
Server running on http://localhost:3000
```

Open a web browser and navigate to `http://localhost:3000` to interact with the interactive audit panel.

---

## 6. Production Build & Startup

Before pushing the application to production environments (e.g. Docker, Heroku, or GCP Cloud Run), verify the production build chain works perfectly.

### Step 1: Build Application
The build script compiles client-side React code into static production folders (`dist/`), and subsequently uses `esbuild` to compile and bundle the Express TypeScript server (`server.ts`) into a production-ready CJS bundle:
```bash
npm run build
```

This generates:
- Client bundle in `dist/`
- Node production backend bundle in `dist/server.cjs`

### Step 2: Launch Production Server
Launch compiled server bundles natively via standard Node.js:
```bash
npm run start
```

The production system binds only on port `3000` and `0.0.0.0` host for maximum microservice compliance, routing client requests and handling background audits efficiently.

---

## 7. Architecture Overview

- **Routing & Rendering**: Single-page routing transitions use **Next.js & Vite Hybrid Setup** optimized through Express middleware.
- **AI Processing Channels**: Anthropic Claude `claude-haiku-3` operates in `/app/api/invoices/upload` routes to extract multi-rate tables and cross-examine them against contracts.
- **Audit Rule Engine**: Programmatically validates freight base miles, shipping weights, fuel surcharges, and detention/liftgate accessorial parameters relative to contract baselines.
- **Email Pipeline**: Uses `Resend` Node SDK to dispatch formatted HTML dispute claims directly from dispute log pages.
- **Simulated Sandbox Roles**: An active Role Simulator block in the dashboard's Settings -> Security tab overrides state rules on endpoints immediately, facilitating compliance testing across check teams and carriers securely.
