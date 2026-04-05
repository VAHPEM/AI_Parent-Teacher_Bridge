# AI Parent–Teacher Bridge (EduTrack)

A hackathon-style web app that connects **teachers**, **parents**, and **AI-assisted** progress reporting. Teachers enter grades, review **CurricuLLM**-generated summaries, and parents view dashboards and chat about their child’s report context.

---

## Problem statement

- Parents want timely, understandable insight into learning progress without waiting for formal reports.
- Teachers are time-poor; drafting individual narratives is heavy.
- Any AI output must be **reviewable** (especially when confidence is low) before it informs parent-facing answers.

This project explores a bridge: **structured data** (weekly records) → **CurricuLLM** (curriculum-aware JSON reports) → **teacher approval** → **parent UI + grounded chat**.

---

## Architecture

| Layer | Stack | Role |
|--------|--------|------|
| **Client** | React 18, Vite, TypeScript | Teacher and parent portals; calls REST API at `http://localhost:8000` |
| **Server** | FastAPI, SQLAlchemy 2, PostgreSQL | REST API, auth placeholders (`parent_id` / `teacher_id` query params), CurricuLLM via OpenAI-compatible client |
| **Optional** | `ai_module/` | Standalone experiments (RAG, batch scripts); **not** required for the main app |

API responses use a shared envelope: `{ "body": <payload>, "message": "<status text>" }`.

---

## Prerequisites

- **Node.js** 18+ (for the client)
- **Python** 3.12+ (for the server)
- **PostgreSQL** with a database you can connect to
- **CurricuLLM API key** (OpenAI-compatible endpoint) for real AI reports and parent chat

---

## Environment variables (server)

Create `server/.env` (see `server/.env` as a template). The server loads it on startup.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | *or* `DB_*` below | Full SQLAlchemy URL, e.g. `postgresql+psycopg2://user:pass@localhost:5432/dbname` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | if no `DATABASE_URL` | Built into a Postgres URL when `DATABASE_URL` is unset |
| `CURRICULLM_API_KEY` | **Yes** (for AI) | API key; **no space** after `=` in `.env` |
| `CURRICULLM_BASE_URL` | No | Default `https://api.curricullm.com/v1` |
| `CURRICULLM_MODEL` | No | Default `gpt-4o-mini` |

---

## Database setup

1. Create an empty PostgreSQL database.
2. Point `server/.env` at it (see above).
3. **Start the server once** — it runs `Base.metadata.create_all()` and a small patch that adds `ai_reports.teacher_notes` if missing (existing DBs).
4. **Load seed data** (optional but recommended for demos):

   ```bash
   psql -U <user> -d <dbname> -f create_data.sql
   ```

Adjust paths/credentials to match your install.

---

## How to run (local dev)

### 1. API server (FastAPI)

```bash
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check: [http://127.0.0.1:8000/](http://127.0.0.1:8000/) should return a short JSON message.

### 2. Client (Vite + React)

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (typically [http://localhost:5173](http://localhost:5173)).

The client is configured to call the API at **`http://localhost:8000`** (`client/src/app/lib/api.ts`). Change that if your API runs elsewhere.

---

## Demo session IDs (no real auth yet)

The UI uses fixed IDs until you add authentication:

| Role | Constant | File |
|------|-----------|------|
| Parent | `DEMO_PARENT_ID = 4` | `client/src/app/lib/config.ts` |
| Teacher | `DEMO_TEACHER_ID = 1` | same |

Parent routes require `parent_id` where noted; teacher routes use `teacher_id`. Seed data in `create_data.sql` is aligned with these IDs for the bundled scenario—if you change IDs or data, update `config.ts` accordingly.

---

## Main features

### Teacher portal (`/teacher/...`)

- Dashboard, classes, grade entry (weekly records)
- **AI Analysis Results** — lists `ai_reports` with summary, support areas, recommendations, CurricuLLM-driven content when generated
- **Reports** — **Generate New Report** calls CurricuLLM **per student** in the class (removes legacy stub rows that start with `AI-generated report for…`)
- Approve / request revision on analyses; optional `teacher_notes` on approve/revise
- Flagged parent questions, Canvas mock sync, settings

### Parent portal (`/parent/...`)

- Child switcher, dashboard, progress, activities, messages, **AI Assistant** chat
- **Parent chat** uses the latest **usable** AI report (skips blocked rows such as pending low-confidence until approved) and calls CurricuLLM with that context
- “Ask a Teacher” threads

### Single-student AI report (API)

`POST /teacher/students/{student_id}/generate-ai-report?teacher_id=<id>&term=Term%202`  
Verifies the teacher owns the student’s class, then creates one `ai_reports` row via CurricuLLM.

---

## API surface (summary)

Routers are mounted under:

- **`/parent`** — children, dashboard, progress, activities, messages, **chat**, questions, settings
- **`/teacher`** — dashboard, classes, grades, **ai-analysis**, **reports/generate**, flagged questions, canvas, etc.
- **`/student`** — create / fetch student (minimal)

Full list: see `server/app/routers/parent_route.py`, `teacher_route.py`, `student_route.py`.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `column ai_reports.teacher_notes does not exist` | Old DB; restart server so startup migration runs, or run `server/sql/001_ai_reports_teacher_notes.sql` manually |
| AI Analysis shows one generic sentence | Legacy stub rows; use **Reports → Generate New Report** (or single-student endpoint) after setting `CURRICULLM_API_KEY` |
| Parent chat always errors or “not configured” | Missing/invalid `CURRICULLM_API_KEY`, or `parent_id` not matching the child’s `parent_id` in the database |
| Parent chat says “no report” / “under review” | No `ai_reports` for that student, or only blocked rows (e.g. high risk pending approval); teacher can approve or generate a new report |
| CORS / network errors | Client must target the same host/port as the running API (default `localhost:8000`) |

---

## Project layout (high level)

```
AI_Parent-Teacher_Bridge/
├── client/                 # React + Vite frontend
├── server/
│   ├── app/
│   │   ├── main.py         # FastAPI app, CORS, routers, create_all + schema patch
│   │   ├── db/             # Engine, sessions, DATABASE_URL / DB_* resolution
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # parent, teacher, student
│   │   └── services/       # business logic, CurricuLLM, parent chat
│   ├── requirements.txt
│   └── sql/                # optional manual SQL patches
├── create_data.sql         # demo seed data
├── ai_module/              # optional; experimental scripts / RAG
└── README.md
```

---

## License / credits

Built for **EduHack**; CurricuLLM is used as an OpenAI-compatible API for report generation and parent chat. Replace demo IDs and open CORS before any production use.
