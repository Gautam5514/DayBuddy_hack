# DayBuddy AI — Frontend

Next.js 16 (App Router) + React 19 + Tailwind CSS v4.

```bash
npm install
cp .env.local.example .env.local   # optional; points at the backend
npm run dev                        # http://localhost:3000
```

| Script          | What it does              |
| --------------- | ------------------------- |
| `npm run dev`   | Dev server                |
| `npm run build` | Production build          |
| `npm start`     | Serve the production build |
| `npm run lint`  | ESLint (Next core-web-vitals) |

## Layout

```
app/
├── page.js               Today: plan, tasks, evening check-in
├── ask/page.js           Ask questions about past check-ins
├── profile/page.js       Preferences
├── components/
│   ├── ui.js             Page shell, headers, buttons, error notice
│   ├── MicButton.js      Voice input (browser speech recognition)
│   └── home/             PlanSection, TaskSection, CheckinSection
├── hooks/                usePrefs, useTasks, useDailyPlan, useAiReady, useNow
└── lib/
    ├── api.js            The only place that knows backend URLs
    ├── constants.js      Shared options and defaults
    ├── dates.js          Date/time formatting
    ├── prefs.js          Preference cache + remote fetch
    └── storage.js        Safe localStorage helpers
```

The app keeps working when the backend is unreachable: preferences come from
localStorage, task changes are applied optimistically, and failed requests
show a friendly message instead of breaking the page.
