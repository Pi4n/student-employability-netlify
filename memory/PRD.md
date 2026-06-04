# Holistic Student Marketability — PRD

## Original Problem Statement
Migrate a full-stack web application from a mock `localStorage` implementation
to a live production environment using a relational database connected via
**Netlify Serverless Functions**, without altering the existing UI structure
or Bootstrap styling. All dummy data generation has been removed.

## Architecture (current, Feb 2026)
- **Frontend:** Static HTML/CSS/JavaScript (Bootstrap 5 dark theme)
- **Backend:** Netlify Serverless Functions (Node.js) using `pg` (node-postgres)
- **Database:** **Supabase (PostgreSQL)** — 10-table relational schema
- **Transformation Layer (Option B):** Server-side data translators between
  frontend format and DB CHECK-constraint values
  (function names still contain "Oracle" for historical reasons but operate
  on PostgreSQL strings).

## File Structure
```
/app/
├── index.html, about.html, admin.html, dashboard.html, logging.html
├── assets/
│   ├── app.js (global window.App, async)
│   ├── admin.js, dashboard.js, logging.js, index.js
│   └── styles.css
├── netlify/
│   └── functions/
│       ├── _shared/{db.js, transformers.js}
│       ├── get-state.js
│       ├── manage-programs.js
│       ├── manage-students.js
│       ├── manage-skills.js
│       ├── manage-courses.js
│       ├── manage-learning-outcomes.js
│       ├── manage-enrollments.js
│       ├── manage-cocurriculum.js
│       └── package.json   (depends on "pg")
├── netlify.toml            (external_node_modules = ["pg", "pg-native"])
└── .env.example            (DATABASE_URL template)
```

## Required Environment Variables
| Var            | Where                                    | Example                                                            |
|----------------|------------------------------------------|--------------------------------------------------------------------|
| `DATABASE_URL` | Netlify UI (prod) and local `.env` (dev) | `postgresql://postgres:PWD@db.<ref>.supabase.co:5432/postgres`     |

## Admin Credentials
- Username: `admin`
- Password: `admin123` (sessionStorage only)

## Data Translation Rules (Option B)
| Field             | Frontend                              | DB string                                              | Direction |
|-------------------|---------------------------------------|--------------------------------------------------------|-----------|
| course_type       | Core                                  | Academic                                               | both      |
| enrollment status | In Progress                           | Active                                                 | both      |
| knowledge_type    | Hard / Soft / Professional            | Academic Knowledge / Technical Skills / Marketability Values | both |
| skill_type        | Cognitive / Soft Skill / Professional | Academic Knowledge / Technical Skills / Marketability Values | both |
| mapping_strength  | 0.0–1.0 (number)                      | Low / Medium / High                                    | both      |
| achievement       | 0.0–1.0 (number)                      | VARCHAR string                                         | both      |
| is_credit_bearing | true/false                            | 1/0                                                    | both      |
| LO domain         | Academic / Co-curricular              | Knowledge / Skills / Values                            | both      |

## Local Development (Windows)
```cmd
cd netlify\functions
npm install
cd ..\..
copy .env.example .env
:: edit .env and paste your Supabase DATABASE_URL
netlify dev
```
Test:
```cmd
curl http://localhost:8888/.netlify/functions/get-state
```

## Production Deploy (Netlify)
1. Push repo to GitHub
2. Netlify → New site from Git → pick repo
3. Site settings → Environment variables → add `DATABASE_URL`
4. Trigger deploy

## Changelog
- **2026-02 (current)**: **Real Oracle → Supabase migration applied to code.**
  Replaced `oracledb` with `pg` (node-postgres) across all 8 functions and
  `_shared/db.js`. SQL now uses `$1, $2…` placeholders and `RETURNING column`.
  Removed obsolete root `server.js` + `package.json` (old local Express
  workaround). `netlify.toml` now externalises `pg` instead of `oracledb`.
- 2026-06: Initial migration from localStorage to Netlify Functions
- 2026-06: 8 Netlify serverless functions + transformer layer
- 2026-06: Refactored all 5 HTML pages and 5 JS files
- 2026-06: Programs & Skills CRUD added to admin
- 2026-06: Analytics Dashboard (tier distribution, top students, avg MI / program)
- 2026-06: About page credits + team photos

## Backlog
### P1
- Verify end-to-end on live Netlify deploy once user sets `DATABASE_URL`
- Add CRUD UI for `SKILL_MAPPING` (LO ↔ Skill)

### P2
- Bulk CSV import for students and courses
- Search/filter and pagination on logging tables
- Export PDF for student dashboards

### P3
- Multi-admin RBAC
- Audit log for mutations
- Real-time updates via Supabase Realtime / WebSockets

## Next Action Items
- User to run `npm install` inside `netlify/functions/` (on their Windows
  machine), populate `.env` with the Supabase `DATABASE_URL`, then `netlify dev`
- Deploy to Netlify and set `DATABASE_URL` in the Site env vars
