# FreightAudit AI — Admin Dashboard (Corrected for Actual Architecture)
# This project is Vite + Express SPA, NOT standard Next.js App Router
# Read this fully before writing a single line of code

---

## ARCHITECTURE REALITY — CRITICAL CONTEXT

This project works as follows:
- Frontend: Vite SPA, client-side routing via pushState/popstate in src/App.tsx
- Backend: Express server in api/_app.ts (1943 lines) — ALL API routes live here
- Auth: Supabase Auth, session managed client-side via onAuthStateChange in src/App.tsx
- The /app/ folder contains React components imported into src/App.tsx — they are 
  NOT Next.js server components. They render client-side only.
- The /app/api/ folder is UNUSED at runtime. All API traffic goes to api/_app.ts.
- vercel.json rewrites /api/(.*) → /api (the Express bundle)

This means:
- Admin pages = new React components in src/components/admin/
- Admin API routes = new Express routes added to api/_app.ts
- Route protection = client-side guard in src/App.tsx + server-side check in Express
- No middleware.ts needed, no server components, no Next.js API routes

---

## LOCKED FILES — DO NOT TOUCH THESE

src/App.tsx — YOU MAY ONLY ADD new route cases for /admin paths.
  Do not change any existing route cases.
  Do not change the auth logic.
  Do not change any existing imports.
  Show me the diff of exactly what you added before saving.

api/_app.ts — YOU MAY ONLY ADD new Express routes at the bottom 
  before the final export/listen.
  Do not change any existing routes.
  Do not change the existing auth middleware.
  Do not change any existing imports at the top.
  Show me exactly what you added before saving.

COMPLETELY LOCKED — DO NOT OPEN OR MODIFY:
  app/ (entire folder — all existing pages and layouts)
  components/ (entire folder — all existing components)
  lib/ (entire folder)
  types/index.ts
  vite.config.ts
  vercel.json
  package.json
  tsconfig.json
  supabase/schema.sql
  All schema*.sql files

---

## NEW FILES YOU ARE ALLOWED TO CREATE

src/components/admin/
  AdminApp.tsx           — Admin shell (sidebar + topbar + outlet)
  AdminSidebar.tsx
  AdminTopBar.tsx
  AdminStatCard.tsx
  AdminOverview.tsx      — Overview dashboard page
  AdminOrganizations.tsx — Orgs list page
  AdminOrgDetail.tsx     — Single org detail page
  AdminUsers.tsx         — Users list page
  AdminUserDetail.tsx    — Single user detail page
  AdminRevenue.tsx       — Revenue page
  AdminActivity.tsx      — Activity logs page
  AdminAbuse.tsx         — Abuse monitor page
  AdminSettings.tsx      — Admin settings page

That is the only new folder and the only new files for the frontend.

---

## SECURITY — DO THIS FIRST

### Step 1 — Super admin check hook

Create src/components/admin/useAdminAuth.ts:

This is a React hook that:
1. Gets the current Supabase session using the browser client 
   (import from lib/supabase/client.ts)
2. Queries the super_admins table:
   supabase.from('super_admins').select('user_id').eq('user_id', user.id).single()
3. Returns { isAdmin: boolean, isLoading: boolean, user }
4. If not admin and not loading, the AdminApp component redirects to /login

The super_admins table already exists in Supabase with your user ID inserted.

### Step 2 — Add admin routes to src/App.tsx

In src/App.tsx, add route cases for paths starting with /admin.
All /admin/* paths should render the AdminApp component.
AdminApp handles its own internal sub-routing between admin pages.

Only add this — do not change anything else in App.tsx:
- Import AdminApp at the top with the other imports
- Add a condition: if pathname starts with '/admin', render <AdminApp />
- The existing auth check in App.tsx should still apply — 
  if no session at all, redirect to login before even reaching AdminApp

### Step 3 — Add admin API routes to api/_app.ts

At the bottom of api/_app.ts, before the final export or listen call,
add an Express middleware for admin routes:

```typescript
// Admin routes — super admin only
const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' })
    
    const { data: adminRow } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    
    if (!adminRow) return res.status(403).json({ error: 'Forbidden' })
    
    req.adminUser = user
    next()
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
}

// Apply to all /api/admin/* routes
app.use('/api/admin', requireSuperAdmin)
```

Then add each admin API route below this middleware block.
Use the supabase client that already exists in api/_app.ts — 
do not create a new one.

---

## ADMIN DESIGN SYSTEM

Completely different from the main app. Dark theme, fuchsia accent.

```
Page background:    #09090B
Surface cards:      #111113
Elevated surface:   #18181B
Borders:            #27272A
Border hover:       #3F3F46

Primary accent:     #E879F9  (fuchsia-400)
Secondary accent:   #22D3EE  (cyan-400)

Text primary:       #FAFAFA
Text secondary:     #A1A1AA
Text muted:         #52525B

Success:            #4ADE80
Warning:            #FB923C
Danger:             #F87171
Info:               #60A5FA
```

Font: Use Inter (already loaded in the project).
Numbers: Use font-mono (JetBrains Mono already loaded).

All styles are inline Tailwind classes on admin components only.
Do not add any CSS to src/index.css or any global stylesheet.

---

## ADMIN API ROUTES TO ADD IN api/_app.ts

Add these Express routes after the requireSuperAdmin middleware block.
Each one is protected automatically by the middleware above.

GET /api/admin/stats
  Run these Supabase queries in parallel using Promise.all:
  - Count of all organizations
  - Count of all rows in org_members
  - Count of all invoices
  - Count of invoices where uploaded_at >= start of current month
  - Sum of total_savings across all invoices
  - Count of organizations created in last 7 days
  Return all as a single JSON object.

GET /api/admin/orgs
  Query params: search, plan, status, sort, page (default 1), limit (default 20)
  Join organizations with org_members to get member count.
  Return paginated list.

GET /api/admin/orgs/:id
  Full org details: org info, all members, last 20 invoices, usage stats.

PATCH /api/admin/orgs/:id
  Body: { action: 'suspend' | 'unsuspend' | 'change_plan', plan?: string }
  Update org status or plan column accordingly.

GET /api/admin/users
  Query params: search, role, status, sort, page, limit
  Join org_members with organizations to get org name per user.
  Return paginated list.

PATCH /api/admin/users/:id
  Body: { action: 'suspend' | 'unsuspend' }
  Update status in org_members table.

GET /api/admin/revenue
  Return: count per plan, estimated MRR (multiply plan counts by price),
  monthly invoice counts for last 12 months grouped by month.

GET /api/admin/activity
  Query params: dateFrom, dateTo, action, orgId, search, page
  Query audit_logs table, join with organizations for org name.
  Return paginated list ordered by created_at desc.

GET /api/admin/abuse
  Run 5 detection queries in parallel:
  1. Orgs uploading more than 3x daily plan limit in any single day
  2. Orgs with 3+ new members created within 1 hour
  3. Orgs with 20+ disputes generated in a single day
  4. Users with 10+ failed login attempts in last hour 
     (query auth.audit_log_entries where payload action = login_failed)
  5. Paid orgs with zero invoices in last 30 days
  Return all findings as a single array with type and severity fields.

POST /api/admin/notes
  Body: { org_id, note_text }
  Insert into admin_notes table.
  Return the created note.

---

## ADMIN PAGES — WHAT EACH ONE SHOWS

All pages are React components that:
- Call their admin API endpoint using fetch with the Supabase session token
  in the Authorization header
- Show a loading state while fetching
- Show an error state if the fetch fails
- Render real data when loaded

### AdminApp.tsx
Internal router for admin pages based on pathname.
Renders AdminSidebar + AdminTopBar on every page.
Contains useAdminAuth hook — if not admin, redirect to /login immediately.
Sub-routes:
  /admin or /admin/overview → AdminOverview
  /admin/organizations → AdminOrganizations
  /admin/organizations/:id → AdminOrgDetail
  /admin/users → AdminUsers
  /admin/users/:id → AdminUserDetail
  /admin/revenue → AdminRevenue
  /admin/activity → AdminActivity
  /admin/abuse → AdminAbuse
  /admin/settings → AdminSettings

### AdminSidebar.tsx
Width 200px, bg-[#09090B], border-r border-[#18181B]
Logo: small fuchsia square + "FreightAudit Admin" text
Navigation links with lucide-react icons (already installed):
  Overview (LayoutDashboard)
  Organizations (Building2)
  Users (Users)
  Revenue (DollarSign)
  Activity (Activity)
  Abuse Monitor (ShieldAlert)
  Settings (Settings)
Active state: border-l-2 border-fuchsia-500 bg-[#18181B] text-white
Inactive: text-zinc-500 hover:text-zinc-300 hover:bg-[#111113]
Bottom: user email + "Back to App" link that navigates to /dashboard

### AdminTopBar.tsx
h-12, bg-[#09090B], border-b border-[#18181B]
Left: current page title
Right: "Super Admin" badge in fuchsia + user avatar with initials

### AdminOverview.tsx
Fetches GET /api/admin/stats
Shows 4 stat cards: Total Orgs, Total Users, Invoices This Month, 
Total Savings Recovered
Below: recent organizations list (last 8 by created_at)
Below: recent activity feed (last 10 audit_log entries)

### AdminOrganizations.tsx
Fetches GET /api/admin/orgs with filter params
Search input + plan filter + status filter
Table: org name, owner email, plan badge, members, invoices this month,
total savings, created date, status badge, actions menu
Actions: View detail, Suspend, Change plan

### AdminOrgDetail.tsx
Fetches GET /api/admin/orgs/:id
Shows: org info card, members table, recent invoices table,
usage stats, admin notes section, danger zone (suspend/delete buttons)

### AdminUsers.tsx
Fetches GET /api/admin/users
Table: email, name, org name, role badge, invoices uploaded,
last active, status badge, suspend/unsuspend button

### AdminRevenue.tsx
Fetches GET /api/admin/revenue
Shows estimated MRR, ARR, plan distribution donut chart (recharts — already installed),
monthly invoice volume bar chart, orgs by plan table
Note at top: "Estimates based on plan data — connect Stripe for accuracy"

### AdminActivity.tsx
Fetches GET /api/admin/activity
Date range filter + action type filter + org filter
Paginated feed, 20 items per page
Each item: colored icon by action type, plain English description, timestamp
Export CSV button

### AdminAbuse.tsx
Fetches GET /api/admin/abuse
Shows warning cards for each detection rule that fires
Each card: rule name, description, affected org/user link, 
Dismiss button, Suspend button
Green "All Clear" message if no warnings

### AdminSettings.tsx
Static page showing:
Plan limits (read from lib/constants/plans.ts if accessible, 
otherwise hardcode the values)
Super admins table (fetch from super_admins)
Data export buttons (trigger CSV download of orgs and users)

---

## HOW TO FETCH FROM ADMIN API IN REACT COMPONENTS

Every admin component fetches like this:

```typescript
const { data: session } = await supabase.auth.getSession()
const token = session?.session?.access_token

const response = await fetch('/api/admin/stats', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
const data = await response.json()
```

Use useEffect + useState for data fetching in each component.
Show a loading spinner while fetching.
Show an error message if response.ok is false.

---

## BUILD ORDER — STOP AFTER EACH STEP AND CONFIRM WITH ME

Step 1: Create useAdminAuth.ts hook
Step 2: Create AdminApp.tsx shell (just the layout, no pages yet)
Step 3: Add /admin route to src/App.tsx (show me the exact diff first)
Step 4: Add requireSuperAdmin middleware to api/_app.ts (show me the exact diff first)
Step 5: Add GET /api/admin/stats route to api/_app.ts
Step 6: Build AdminOverview.tsx using the stats endpoint
Step 7: Test — visit /admin in browser, confirm it loads and shows real data
  DO NOT CONTINUE PAST STEP 7 WITHOUT MY CONFIRMATION
Step 8: Add remaining API routes to api/_app.ts
Step 9: Build remaining admin page components one at a time
Step 10: AdminSidebar navigation between pages

---

## FINAL REMINDER

The two Supabase tables already exist:
  super_admins — already has the super admin user ID inserted
  admin_notes — already created

Do not recreate them. Do not run any SQL.

If you are ever unsure about something in api/_app.ts or src/App.tsx,
stop and ask rather than guessing. These two files run the entire app.
A mistake in either one breaks everything for all users.