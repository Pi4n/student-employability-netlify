# CCS3402 Holistic Student Marketability — Production Setup

A full-stack web application built with vanilla HTML/CSS/JavaScript on the
frontend and **Netlify Serverless Functions** + **Supabase (PostgreSQL)** on
the backend.

## Architecture

```
.
├── index.html              # Landing page
├── about.html              # About page
├── admin.html              # Admin panel (LO + Student CRUD)
├── dashboard.html          # Student Marketability Dashboard
├── logging.html            # Activity Logging (Staff + Student modules)
├── assets/
│   ├── app.js              # Global window.App namespace (async)
│   ├── admin.js            # Admin page logic
│   ├── dashboard.js        # Dashboard radar + index
│   ├── index.js            # Landing page connectivity check
│   ├── logging.js          # Forms for courses, activities, enrollments
│   └── styles.css          # Bootstrap dark theme + custom styles
├── netlify/
│   └── functions/
│       ├── _shared/
│       │   ├── supabaseClient.js          # Supabase client (env vars)
│       │   └── transformers.js            # Frontend ⇄ DB value translators
│       ├── get-state.js                   # GET all data (universal fetch)
│       ├── manage-students.js             # POST students
│       ├── manage-programs.js             # POST programs
│       ├── manage-courses.js              # POST courses
│       ├── manage-skills.js               # POST employability skills
│       ├── manage-learning-outcomes.js    # POST/DELETE learning outcomes
│       ├── manage-enrollments.js          # POST/DELETE enrollments
│       └── manage-cocurriculum.js         # POST activities, mappings, participation
├── package.json            # Root deps (@supabase/supabase-js) — required for Netlify
└── netlify.toml            # Netlify deployment config
```

## Required Environment Variables (Netlify Dashboard)

Set these in **Netlify → Site settings → Environment variables**:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `SUPABASE_URL` | Project URL — `https://<project-ref>.supabase.co` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-only, bypasses RLS) | Supabase → Project Settings → API |

> **NEVER** commit these values or expose the service-role key to the browser.
> They are read via `process.env.*` only inside Netlify Functions (server-side).

## Data Translation Layer

The application uses transformation middleware in
`netlify/functions/_shared/transformers.js` to convert between the frontend
display values and the database `CHECK`-constraint values:

| Field | Frontend | Database |
|-------|----------|----------|
| course_type | `Core` / `Elective` | `Academic` / `Technical` / `Elective` |
| enrollment status | `In Progress` / `Completed` | `Active` / `Completed` / `Withdrawn` |
| knowledge_type | `Hard` / `Soft` / `Professional` | `Academic Knowledge` / `Technical Skills` / `Marketability Values` |
| mapping_strength | `0.0`–`1.0` (number) | `Low` / `Medium` / `High` |
| achievement | `0.0`–`1.0` (number) | text |
| LO domain | `Academic` / `Co-curricular` | `Knowledge` / `Skills` / `Values` |
| is_credit_bearing | `true` / `false` | `1` / `0` |

## Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

Stored in `sessionStorage` (no localStorage).

## Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Install dependencies (from project root)
npm install      # or: yarn

# Set environment variables
export SUPABASE_URL=https://<project-ref>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<your service role key>

# Run locally (functions + static files on http://localhost:8888)
netlify dev
```

## Deployment

1. Push the repository to GitHub.
2. Connect the repo to Netlify (build settings come from `netlify.toml`).
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the Netlify env-vars UI.
4. Trigger deploy — Netlify auto-installs root `package.json` dependencies and
   bundles the functions with `esbuild`.

## Key Design Principles

- **No localStorage** for application data (only sessionStorage for admin auth).
- **No seed/reset functionality** — an empty database is a valid state.
- **All data is async** via `await App.get()` and `await App.{Entity}.{action}()`.
- **Server-side data translation** preserves the database `CHECK` constraints.
- **Graceful empty state** — UI works correctly with zero rows.
- **Secure credentials** — only `process.env.*` inside Netlify Functions, never in client code.
