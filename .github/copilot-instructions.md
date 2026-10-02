# DayBuddy — instructions for Copilot

DayBuddy is a small daily companion built for one friend, Yashu. It plans her day,
tracks tasks, takes an evening check-in and answers questions about her past days.
The AI is Gemma 4 (open-weight) through the Gemini API.

## Layout
- `backend/` — Node 22, Express 5, Zod, Mongoose. Entry: `src/server.js`.
  - `src/routes` thin HTTP layer, `src/services` logic (Gemma, ElevenLabs, planners),
    `src/storage` Mongo with an in-memory fallback, `src/schemas.js` request validation.
  - Tests: `npm test` (node:test). Lint: `npm run lint`.
- `frontend/` — Next.js 16 App Router, React 19, Tailwind v4. Backend calls live only in
  `app/lib/api.js`. Shared state lives in `app/hooks`.

## Rules
- Plain JavaScript, CommonJS on the backend, ES modules on the frontend. No TypeScript.
- Every new request payload gets a Zod schema in `backend/src/schemas.js`.
- The app must never break when an external service is down: Gemma failing falls back
  to the rule-based planner, voice falls back to the browser, Mongo falls back to memory.
- Never log or send check-ins, tasks or notes to third parties other than Gemma.
  Sentry traces must not include prompt or answer text.
- Secrets only via environment variables. Never commit `.env`.
- Add or update tests for backend changes. Run `npm run lint && npm test` before finishing.

## Tone of the UI and copy
Warm and plain, like a friend texting. No exclamation-mark spam, no wellness-app clichés,
no sparkle emoji. Keep the cream/terracotta/sage palette defined in `frontend/app/globals.css`.
