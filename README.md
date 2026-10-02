<div align="center">

# 🌞 DayBuddy AI

### Your personal daily companion — built for a friend.

DayBuddy AI gently guides someone through their day: when to wake up, when to
move, what to eat, what to focus on, and how the day went — then uses an
**open-source AI model (Gemma)** to shape a plan around *their* life.

**Built for a Friend · open-source AI at its core**

</div>

---

## ✨ Why DayBuddy?

Most reminder apps are dumb lists. DayBuddy understands a person — their
wake-up time, food and exercise preferences, goals, today's tasks, and even
how yesterday went — and turns that into a warm, realistic daily plan.

> _"Good morning, Ananya! You have 3 important tasks today._
> _Yesterday's workout got missed — let's start with a light 15-minute walk._
> _For breakfast, try poha with curd."_

That personalization is powered by **Gemma 4**, Google's open-source model,
called through the Gemini API (free tier) — no GPU or local install needed, so
the app deploys anywhere.

---

## 🧩 Features

| | Feature | What it does |
|---|---|---|
| 📋 | **Daily Dashboard** | A clean timeline of the day — wake up, exercise, meals, focus blocks, wind-down |
| ✅ | **Tasks** | Add, complete, and remove tasks; progress is tracked live |
| 👤 | **Profile & Preferences** | Wake/sleep times, food & exercise preferences, and a daily goal |
| 🤖 | **AI Daily Plan** | Gemma builds a plan from your preferences, tasks, and yesterday's check-in |
| 🥗 | **Meal & Exercise Suggestions** | General wellness guidance aligned to your preferences |
| 🌙 | **Evening Smart Check-in** | Did you exercise? Skip a meal? How was your mood? → a day summary |
| 🔁 | **Adaptive planning** | Tomorrow's plan adjusts to today's check-in (e.g. missed workout → lighter start) |
| 💬 | **Ask about your days** | Ask "why was I tired this week?" — answered only from your own check-ins, with the dates it used |
| 🎙️ | **Voice input** | Speak tasks, check-in notes and questions (browser speech recognition, no server needed) |
| 🇮🇳 | **Hinglish mode** | Plans and answers in casual Hindi + English, if that's how you talk |

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 |
| **Backend** | Node.js · Express 5 · Zod (validates model output) |
| **Database** | MongoDB (via Mongoose) — with graceful in-memory fallback |
| **AI** | Gemma 4 (open-source) via the Gemini API — with a rule-based fallback planner |

Everything degrades gracefully: no MongoDB? It runs in memory. No Gemma? A
built-in planner takes over. The app **never breaks during a demo.**

---

## 📁 Project Structure

```
hack/
├── frontend/                       # Next.js app
│   └── app/
│       ├── page.js                 # Today: plan, tasks, evening check-in
│       ├── ask/page.js             # "Ask about your days"
│       ├── profile/page.js         # Preferences form
│       ├── components/             # UI primitives + home page sections
│       ├── hooks/                  # usePrefs, useTasks, useDailyPlan, …
│       └── lib/                    # API client, constants, date + storage helpers
└── backend/                        # Express API
    ├── src/
    │   ├── server.js               # Entry point: connect DB, listen, graceful shutdown
    │   ├── app.js                  # Express app factory (used by tests too)
    │   ├── config.js               # All environment variables, read once
    │   ├── constants.js            # Shared domain values (moods, defaults, limits)
    │   ├── schemas.js              # Zod schemas for every request body
    │   ├── routes/                 # prefs, tasks, checkins, ai, health
    │   ├── services/               # Gemma client, prompts, plan parser, rule planner
    │   ├── storage/                # Mongo + in-memory stores behind one interface
    │   └── middleware/             # Current user, JSON errors
    └── test/                       # node:test unit + HTTP tests
```

### How a plan is made

```
POST /api/plan ─► validate (Zod) ─► latest check-in ─► Gemma 4 ─► parse + validate JSON ─► response
                                                          │ timeout / bad output / no key
                                                          └──────► rule-based planner ─────► response
```

Every response says which path it took (`"source": "gemma" | "rule-based"`).

---

## 🚀 Getting Started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # defaults are fine for local dev
npm run dev              # → http://localhost:5001 (auto-restarts on change)
```

> **Note:** The backend uses port **5001** because macOS reserves 5000 for
> AirPlay. Change it with `PORT` in `.env` if you like.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev              # → http://localhost:3000
```

Open **http://localhost:3000** and you're in. 🎉

### 3. (Optional) Turn on real AI

Without a key, DayBuddy uses its built-in planner. To use Gemma 4:

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Put it in `backend/.env` as `GEMMA_API_KEY=...`
3. Restart the backend and reload the dashboard — the status dot turns
   **green** and plans are marked **✨ Gemma**.

### 4. Quality checks

```bash
cd backend  && npm test && npm run lint     # planner, parser, prompts, HTTP API
cd frontend && npm run lint && npm run build
```

Backend tests run against the in-memory store with the API key blanked, so
they need neither MongoDB nor network access.

---

## 🔌 API Reference

Base URL: `http://localhost:5001`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check + storage/model info |
| `GET` | `/api/prefs` | Get preferences |
| `PUT` | `/api/prefs` | Save preferences |
| `GET` | `/api/tasks` | List tasks |
| `POST` | `/api/tasks` | Add a task `{ label }` |
| `PATCH` | `/api/tasks/:id` | Update `{ done?, label? }` |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `POST` | `/api/checkin` | Save an evening check-in (`201`) |
| `GET` | `/api/checkin/latest` | Most recent check-in |
| `GET` | `/api/checkins` | Recent check-ins (`?limit=14`) |
| `POST` | `/api/ask` | Ask a question about your saved days `{ question }` |
| `GET` | `/api/health` | Database + Gemma status |
| `GET` | `/api/ai/status` | Is Gemma ready? |
| `POST` | `/api/plan` | Generate a daily plan |

<details>
<summary><strong>Example: generate a plan</strong></summary>

```bash
curl -X POST http://localhost:5001/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "prefs": {
      "name": "Ananya", "wakeTime": "07:00", "sleepTime": "23:00",
      "foodPreference": "Vegetarian", "exercisePreference": "Walking",
      "goal": "Stay active and organized"
    },
    "tasks": [{ "id": 1, "label": "Finish assignment", "done": false }]
  }'
```

The response includes `greeting`, a `plan` array, suggested `tasks`, a `tip`,
and a `source` of either `"gemma"` or `"rule-based"`.

</details>

**Errors** always share one shape. Invalid input returns `400` with the
offending fields:

```json
{ "success": false, "error": "Invalid request",
  "details": [{ "path": "wakeTime", "message": "Expected a 24h time like 07:30" }] }
```

---

## ⚙️ Configuration

Backend `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5001` | Express port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/daybuddy` | MongoDB connection |
| `GEMMA_API_KEY` | _(empty)_ | Gemini API key (free at AI Studio) |
| `GEMMA_API_MODEL` | `gemma-4-26b-a4b-it` | Gemma model name |
| `GEMMA_TIMEOUT_MS` | `45000` | Fallback to rule-based after this |
| `DEFAULT_USER_ID` | `demo-user` | Single-user scope (auth comes later) |
| `CORS_ORIGIN` | `*` | Allowed frontend origin, e.g. `https://daybuddy.app` |

Frontend `.env.local` (optional):

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `http://localhost:5001` | Backend URL |

---

## 🗺️ Roadmap

- [x] Dashboard, tasks, and preferences
- [x] AI daily plan with meal & exercise suggestions
- [x] Evening Smart Check-in with adaptive next-day planning
- [x] MongoDB persistence
- [x] Open-source Gemma 4 integration (via Gemini API)
- [ ] Reminders & notifications
- [ ] Multi-user accounts

---

## 💜 About

DayBuddy AI was built for the **"Build for a Friend"** challenge — solving a
real friend's everyday struggle to stay on top of their routine, with
**open-source AI at its core.**
