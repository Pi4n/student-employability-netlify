# CCS3402 Holistic Student Marketability — Production Setup

A full-stack web application built with vanilla HTML/CSS/JavaScript on the
frontend and **Netlify Serverless Functions** + **Oracle SQL** on the backend.

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
│       │   ├── db.js                       # Oracle connection (env vars)
│       │   └── transformers.js             # Option B data translators
│       ├── get-state.js                    # GET all data (universal fetch)
│       ├── manage-students.js              # POST students
│       ├── manage-courses.js               # POST courses
│       ├── manage-learning-outcomes.js     # POST/DELETE learning outcomes
│       ├── manage-enrollments.js           # POST/DELETE enrollments
│       ├── manage-cocurriculum.js          # POST activities, mappings, participation
│       └── package.json                    # oracledb dependency
└── netlify.toml            # Netlify deployment config
```

## Required Environment Variables (Netlify Dashboard)

| Variable | Description | Example |
|----------|-------------|---------|
| `ORACLE_USER` | Oracle database username | `myuser` |
| `ORACLE_PASSWORD` | Oracle database password | `mypassword` |
| `ORACLE_CONN_STRING` | Oracle connection string | `host:1521/service` |

**NEVER** hardcode these values. They are read via `process.env.*` in
`netlify/functions/_shared/db.js`.

## Data Translation Layer (Option B)

The application uses transformation middleware in
`netlify/functions/_shared/transformers.js` to convert between frontend
format and Oracle schema:

| Field | Frontend | Oracle |
|-------|----------|--------|
| course_type | `Core` | `Academic` |
| enrollment status | `In Progress` | `Active` |
| knowledge_type | `Hard`/`Soft`/`Professional` | `Academic Knowledge`/`Technical Skills`/`Marketability Values` |
| mapping_strength | `0.0`–`1.0` (number) | `Low`/`Medium`/`High` |
| achievement | `0.0`–`1.0` (number) | `VARCHAR2` string |
| LO course_id | (not provided) | Auto-assigned to "General" course |

## Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

Stored in `sessionStorage` (no localStorage).

## Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Install function dependencies
cd netlify/functions && npm install && cd ../..

# Set environment variables
export ORACLE_USER=your_user
export ORACLE_PASSWORD=your_password
export ORACLE_CONN_STRING=your_host:1521/service

# Run locally
netlify dev
```

## Deployment

1. Push to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy

## Key Design Principles

- ✅ **No localStorage** for application data (only sessionStorage for admin auth)
- ✅ **No seed/reset functionality** — empty database is normal
- ✅ **All data is async** via `await App.get()` and `await App.{Entity}.{action}()`
- ✅ **Server-side data translation** preserves the Oracle schema as-is
- ✅ **Graceful empty state** — UI works correctly with zero rows
- ✅ **Secure credentials** — only `process.env.*` in serverless functions
