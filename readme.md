# LogicForge 🧠
### AI Cognitive Remediation Engine for Engineers

> **Not adaptive difficulty. Adaptive cognition.**

LogicForge is an AI-powered training platform that doesn't just grade your code — it remembers how you think. It detects recurring cognitive mistake patterns across sessions, targets them with precision problems, and tracks their extinction over time.

---

## The Problem

Most platforms adapt difficulty, not thinking. Students repeat the same logical mistakes across problems. Syntax improves. Cognitive flaws persist.

> Engineers don't fail because of syntax. They fail because of recurring cognitive patterns.

---

## Our Core Insight

Traditional systems treat errors as isolated events. LogicForge treats them as **behavioral clusters**.

- If a mistake repeats → it's cognitive, not accidental
- True improvement = reduction in recurrence rate of specific mistake types
- We don't track scores. **We track mistake extinction.**

---

## How It Works

```
User solves DSA problem
        ↓
AI analyzes solution (Gemini 2.5 Flash)
        ↓
Extracts structured mistake tags
        ↓
Stores mistake clusters in memory (Supabase)
        ↓
Generates next task targeting dominant cognitive weakness
        ↓
Tracks recurrence over sessions → shows improvement graph
```

---

## Features

- **Baseline Assessment** — 5-question mixed quiz (MCQ + bug fixing) to determine starting difficulty before the first session
- **AI Cognitive Classification** — Gemini classifies code into 6 structured mistake tags with confidence scores and line-specific reasoning
- **Persistent Cognitive State** — Mistake history stored per user across sessions in PostgreSQL
- **Targeted Problem Selection** — Next problem is chosen based on the user's dominant weakness tag, not random difficulty
- **Recurrence Graph** — Visual proof of cognitive improvement across sessions
- **Extinction Report** — Shows which mistake types have been eliminated vs still active

---

## Mistake Taxonomy (6 Types)

| Tag | Description |
|-----|-------------|
| `missed_edge_case` | Failing to handle empty arrays, nulls, or boundary inputs |
| `off_by_one_error` | Loop or index running one step too many or too few |
| `incorrect_loop_boundary` | Wrong range bounds causing missed or extra iterations |
| `unnecessary_nested_loop` | O(n²) solution where O(n) exists |
| `base_condition_flaw` | Incorrect initialization or base case in logic |
| `redundant_computation` | Repeating work that could be cached or avoided |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Code Editor | Monaco Editor |
| Charts | Recharts |
| Backend | FastAPI (Python) |
| AI Classification | Google Gemini 2.5 Flash |
| Database | PostgreSQL via Supabase |
| ORM | SQLAlchemy |

---

## Project Structure

```
logicforge/
├── frontend/                  # Next.js App
│   ├── app/
│   │   ├── page.tsx           # Landing — user ID entry
│   │   ├── quiz/page.tsx      # Baseline assessment quiz
│   │   ├── problem/[id]/      # Problem solving + code editor
│   │   └── dashboard/         # Recurrence graph + session history
│   ├── components/
│   │   ├── Editor.tsx         # Monaco code editor
│   │   ├── ProblemCard.tsx    # Problem display
│   │   ├── MistakeTagBadge.tsx
│   │   ├── RecurrenceGraph.tsx
│   │   └── SessionSummary.tsx
│   ├── lib/api.ts             # All backend API calls
│   └── types/index.ts         # Shared TypeScript types
│
└── backend/                   # FastAPI App
    ├── main.py
    ├── api/routes/
    │   ├── submit.py          # POST /api/submit
    │   ├── problems.py        # GET /api/problems
    │   ├── sessions.py        # GET /api/sessions/{user_id}
    │   └── analytics.py       # GET /api/analytics/{user_id}
    ├── core/
    │   ├── classifier.py      # Gemini AI classification
    │   ├── recurrence.py      # Recurrence rate calculator
    │   └── task_generator.py  # Next problem selector
    ├── db/
    │   ├── models.py          # SQLAlchemy ORM models
    │   ├── database.py        # DB connection
    │   └── crud.py            # DB operations
    ├── schemas/analysis.py    # Pydantic schemas
    └── data/problems.json     # MVP problem bank (10 problems)
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase account (free tier)
- Google AI Studio API key (free)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL and GEMINI_API_KEY

# Run the server
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Frontend runs at `http://localhost:3000`

### Environment Variables

```env
# backend/.env
DATABASE_URL=postgresql://postgres.xxxx:password@aws-x-region.pooler.supabase.com:6543/postgres?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
```

### Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE problems (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    target_tags JSONB DEFAULT '[]',
    domain VARCHAR DEFAULT 'arrays'
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    problem_id VARCHAR REFERENCES problems(id),
    session_num INTEGER NOT NULL,
    analysis_json JSONB NOT NULL,
    clean_tags JSONB DEFAULT '[]',
    submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mistake_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id),
    tag VARCHAR NOT NULL,
    session_num INTEGER NOT NULL,
    confidence_score FLOAT NOT NULL,
    reasoning_summary TEXT NOT NULL,
    submission_id INTEGER REFERENCES submissions(id)
);
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submit` | Submit code for AI analysis |
| GET | `/api/problems` | Get all problems (seeds DB on first call) |
| GET | `/api/problems/{id}` | Get single problem |
| GET | `/api/sessions/{user_id}` | Get user session history |
| GET | `/api/analytics/{user_id}` | Get recurrence data + extinction report |

### Submit Payload Example

```json
{
  "user_id": "john_doe",
  "session_num": 1,
  "problem_id": "p_001",
  "code": "def solution(arr):\n    return max(arr)",
  "language": "python"
}
```

---

## Demo Flow (3 Sessions)

1. Enter user ID on landing page
2. Complete 5-question baseline quiz → routed to appropriate difficulty
3. **Session 1** → Solve problem → AI detects mistake tags → stored
4. **Session 2** → Targeted problem based on dominant weakness → solve again
5. **Session 3** → Same tags should show reduced recurrence
6. **Dashboard** → Recurrence graph shows downward trend per tag

---

## Measurement of Improvement

```
recurrence_rate(tag) = occurrences / total_sessions
```

Improvement is defined as reduction in recurrence of specific cognitive clusters under equal or higher difficulty.

| Mistake Type | Session 1 | Session 2 | Session 3 |
|---|---|---|---|
| Edge Case Neglect | 2 | 1 | 0 |
| Loop Boundary Error | 1 | 1 | 0 |

---

## MVP Scope

- **Domain:** Arrays + Iterative reasoning *(current)*
- **Problem Bank:** 10 hand-crafted problems across difficulty 1–3 *(current)*
- **Baseline Quiz:** 5 fixed questions covering the 6 cognitive tags *(current)*
- **Sessions:** 3-session demo flow
- **Mistake Types:** 6 cognitive tags
- **Language Support:** Python (MVP)

> **Note on scalability:** The current implementation is intentionally scoped to the DSA domain with a fixed problem bank and baseline quiz. The architecture is domain-agnostic by design — the same cognitive mistake taxonomy (edge cases, boundary errors, complexity flaws etc.) applies broadly across technical disciplines. Expanding to new domains requires only adding problems to `problems.json` and extending the baseline quiz questions. No core system changes needed.

---

## Scalability Roadmap

### Domain Expansion
The cognitive mistake taxonomy is not DSA-specific. The same patterns appear across engineering disciplines:

| Domain | Applicable Mistake Tags |
|--------|------------------------|
| Arrays & Iteration *(current)* | All 6 tags |
| Recursion & Trees | `base_condition_flaw`, `missed_edge_case`, `off_by_one_error` |
| Dynamic Programming | `redundant_computation`, `base_condition_flaw` |
| System Design | `missed_edge_case`, `unnecessary_nested_loop` (as inefficient architecture) |
| Parallel Computing | `incorrect_loop_boundary`, `redundant_computation` |

Adding a new domain = adding problems to `problems.json` with the appropriate `target_tags` and `domain` field. Zero backend changes required.

### Baseline Quiz Expansion
The current baseline is 5 fixed questions scoped to DSA arrays. This is designed to be extended:
- Questions can be stored in a database instead of hardcoded
- Domain-specific quiz banks can be loaded dynamically per user's chosen track
- Difficulty calibration can become more granular as the question bank grows

### Problem Bank Expansion
`problems.json` is the seed file for the MVP. In production this becomes a full problems table with domain filtering, allowing thousands of problems to be served while the targeting logic (`task_generator.py`) remains unchanged.

---

## Vision

> Education systems measure performance. We measure cognitive evolution.

Future extensions:
- Recursion, Dynamic Programming, System Design domains
- Dynamic AI-generated problem bank per weakness tag
- Cognitive profile dashboard with long-term trend analysis
- College and corporate training integration
- Multi-language support (Java, C++, JavaScript)
- On-device inference optimization for AMD AI PC

---

## Built At

AMD Hackathon 2026 

---

*LogicForge builds engineers who don't just solve problems — they stop repeating them.*
