# DayBuddy AI — Backend

Express 5 API for DayBuddy AI. It stores preferences, tasks and evening
check-ins, and turns them into a daily plan with the open-source **Gemma 4**
model (via the Gemini API), falling back to a rule-based planner whenever the
model is unavailable.

## Run

```bash
npm install
cp .env.example .env   # defaults work for local dev
npm run dev            # watch mode; or `npm start` for production
```

The server starts at `http://localhost:5001`. (macOS reserves port 5000 for
AirPlay, so the default is 5001; change it with `PORT`.)

| Script         | What it does                                 |
| -------------- | -------------------------------------------- |
| `npm start`    | Start the API                                |
| `npm run dev`  | Start with auto-restart on file changes      |
| `npm test`     | Unit + HTTP tests (`node:test`, no network)  |
| `npm run lint` | ESLint                                       |

## Layout

```
src/
├── server.js        Entry point: connect DB, listen, shut down on SIGINT/SIGTERM
├── app.js           createApp() — the Express app, without listening
├── config.js        Every env variable, parsed and frozen in one place
├── constants.js     Moods, languages, plan kinds, default prefs, input limits
├── schemas.js       Zod schemas for every request
├── errors.js        HttpError + notFound()
├── middleware/      currentUser (req.userId), JSON 404 + error handler
├── routes/          health, prefs, tasks, checkins, ai
├── services/
│   ├── gemmaClient.js   HTTP client for the Gemini API (text in, text out)
│   ├── prompts.js       Pure prompt builders
│   ├── planParser.js    Model text → validated plan (or null)
│   ├── rulePlanner.js   Deterministic fallback planner
│   └── assistant.js     Use cases: plan with fallback, answer a question
└── storage/
    ├── index.js         Store facade: Mongo when connected, memory otherwise
    ├── mongoStore.js    Mongoose implementation
    ├── memoryStore.js   In-memory implementation
    ├── mappers.js       Record → API shape (shared by both stores)
    ├── models.js        Mongoose schemas
    └── connection.js    connect / disconnect / isConnected
```

Design notes:

- **Routes stay thin.** They parse input with Zod, call a store or service,
  and return JSON. Express 5 forwards thrown errors to one handler, so there
  is no try/catch boilerplate.
- **One store interface, two implementations.** If MongoDB is down at start-up
  or drops later, requests transparently use the in-memory store.
- **The model is never trusted blindly.** Its JSON is extracted, validated and
  normalized; unusable output triggers the rule-based planner.
- **Testable by construction.** `createApp()` doesn't listen, and the Gemma
  client can be injected into the services, so tests never touch the network.

## Configuration

| Variable           | Default                              | Purpose                                     |
| ------------------ | ------------------------------------ | ------------------------------------------- |
| `PORT`             | `5001`                               | HTTP port                                   |
| `MONGODB_URI`      | `mongodb://127.0.0.1:27017/daybuddy` | MongoDB connection (memory fallback if down) |
| `GEMMA_API_KEY`    | _(empty)_                            | Free key from aistudio.google.com/apikey    |
| `GEMMA_API_MODEL`  | `gemma-4-26b-a4b-it`                 | Model name                                  |
| `GEMMA_TIMEOUT_MS` | `45000`                              | Give up on the model after this long        |
| `DEFAULT_USER_ID`  | `demo-user`                          | Single-user scope until auth exists         |
| `CORS_ORIGIN`      | `*`                                  | Allowed browser origin                      |

## API

| Method | Path                  | Purpose                                         |
| ------ | --------------------- | ----------------------------------------------- |
| GET    | `/`                   | Liveness + model + storage mode                 |
| GET    | `/api/health`         | Readiness: DB mode + Gemma reachability (503 if degraded) |
| GET    | `/api/prefs`          | Get preferences                                 |
| PUT    | `/api/prefs`          | Save preferences (partial updates allowed)      |
| GET    | `/api/tasks`          | List tasks                                      |
| POST   | `/api/tasks`          | Add a task `{ label }` → `201`                  |
| PATCH  | `/api/tasks/:id`      | Update `{ label?, done? }`                      |
| DELETE | `/api/tasks/:id`      | Delete a task                                   |
| POST   | `/api/checkin`        | Save an evening check-in → `201`                |
| GET    | `/api/checkin/latest` | Most recent check-in                            |
| GET    | `/api/checkins`       | Recent check-ins (`?limit=1..60`, default 14)   |
| GET    | `/api/ai/status`      | Is Gemma ready?                                 |
| POST   | `/api/plan`           | Generate a daily plan                           |
| POST   | `/api/ask`            | Answer `{ question }` from saved check-ins      |

Success responses carry `"success": true`. Errors share one shape:

```json
{ "success": false, "error": "Invalid request", "details": [{ "path": "mood", "message": "..." }] }
```

### `POST /api/plan`

```json
{
  "prefs": { "name": "Ananya", "wakeTime": "07:00", "foodPreference": "Vegetarian" },
  "tasks": [{ "label": "Finish assignment", "done": false }]
}
```

```json
{
  "success": true,
  "greeting": "Good morning, Ananya.",
  "plan": [{ "time": "7:00 AM", "title": "Wake up", "icon": "🌅", "kind": "routine" }],
  "tasks": ["Finish assignment"],
  "tip": "Start with the assignment right after breakfast.",
  "source": "gemma"
}
```

`source` is `"gemma"` when the model wrote the plan and `"rule-based"` when
the fallback did (a `note` field explains why).
