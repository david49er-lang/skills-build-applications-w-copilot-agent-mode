# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the React UI last, with route-level fetches to `/api` and accessible loading, empty, success, and error states so the browser reflects backend behavior without hiding failures.
- Logic tier decision: Implement the service layer before the UI, keeping validation and business rules in Express services and returning deliberate 4xx responses instead of Mongo/Mongoose cast errors.
- Data tier decision: Strengthen the Mongoose schemas first, ensure required fields and defaults exist, and keep the seed script idempotent and safe for existing data by upserting demo records without clearing collections.
- Activity tracking approach: Validate user and team IDs, compute `points` and `occurredAt` from the submitted payload, and persist `user`, `team`, `type`, and `minutes` with a 201 response for valid records.
- Team management approach: Require a `name` and `mascot`, default `members` to an empty array, and keep team membership arrays synced with the associated users.
- Leaderboard approach: Aggregate team totals from activity points, order by total descending, and assign a 1-based rank to each team entry.
- Workout suggestions approach: Match the requested user email to a seeded user, infer the preferred focus from that user’s recent activity or goal, and return a ranked suggestion list with explanatory reasons.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Result: passing (5 tests). Required model fields and defaults are enforced, and the seed test confirms repeatable upserts preserve unrelated records and reconcile demo team membership.
  - Meaning: the data tier enforces the model contracts and can provide stable fixtures to the API.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Result: passing (4 tests). Services validate payloads and references, create activities and teams, aggregate ranked leaderboard totals, and recommend workouts based on recent activity or goals.
  - Meaning: the logic tier implements the documented `/api/*` behavior, including deliberate 4xx responses for invalid or unknown references.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Result: passing (15 tests). Each capability fetches its API data and renders accessible loading, empty, success, and error states.
  - Meaning: the presentation tier now reflects API responses and communicates request states accessibly.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Result: passing. TypeScript compilation succeeds.
  - Meaning: the backend is type-correct as well as contract-tested.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Result: passing. TypeScript compilation and the Vite production build succeed.
  - Meaning: the frontend is type-correct and production-buildable as well as contract-tested.
