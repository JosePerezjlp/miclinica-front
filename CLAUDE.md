# Project: MiClínica v2 — Frontend (React + Vite)

## Stack
- **Vite + React + TypeScript**
- **React Router v7** (`react-router-dom`) — routes declared in `src/App.tsx`
- **TailwindCSS v4** — always use `className`, never inline `style={{}}` (except for truly dynamic values that can't be expressed as a class) and never CSS modules
- **Axios** with token-refresh interceptor at `src/api/apiClient.ts` — **never use `fetch`**
- **Redux Toolkit's `configureStore`**, but with **manual reducers** (switch/case) registered directly in the `reducer` object — **NO `createSlice`** for new code (see exception below)
- **redux-thunk** (via RTK's default middleware) for async actions
- **react-hot-toast** for notifications (`toast.success` / `toast.error`)
- **lucide-react** for icons
- **React Hook Form** + **Zod** for all forms in new features (`useForm` + `zodResolver`)

> Existing features (`Cities`, `Plans`, `Benefits`, `Roles`, etc.) predate this rule and use plain controlled `useState` form objects instead. Don't rewrite them just to add RHF/Zod — but **every new feature's form must use RHF + Zod** going forward.

> One legacy exception exists: `src/features/AffiliateGroups/AffiliateGroups.detail.reducer.ts` uses `createSlice`. It predates the current convention — don't replicate it, and don't rewrite it unless explicitly asked.

## Architecture rules (mandatory)

### English-only code
All code identifiers must be in English: feature names, file names, component names, interfaces/types, constants, variables, function names, comments, route paths.
UI copy shown to end users is in Spanish.

### Feature structure
```
src/features/<FeatureName>/
  <FeatureName>.types.ts        ← <X>Response / Create<X>Request / Update<X>Request interfaces + local form-state types
  <FeatureName>.action.ts       ← action type constants + action creators + thunks. Imports the feature's service — NEVER apiClient directly
  <FeatureName>.reducer.ts      ← switch/case reducer, state shape { loading, saveLoading, error, data }
  <FeatureName>.container.tsx   ← orchestration + UI (table/list + modal). The CRUD modal typically lives inline here (see Cities/Plans/Benefits) rather than split into a separate presentational file
  <FeatureName>.constants.ts    ← Zod schema(s) for the feature's form(s) (export the inferred type via z.infer<>), plus any static data/dropdown options the feature needs
  <FeatureName>.<role>.tsx      ← OPTIONAL: presentational child, only when the container grows too large to stay inline (see "new-screen" below)

src/api/<featureName>.service.ts ← the ONLY file (besides apiClient.ts itself) that imports apiClient for this feature. Wraps flat CRUD calls: list() / create() / update() / remove()
```

Reference implementations to copy from: `src/features/Cities/`, `src/features/Plans/`, `src/features/Benefits/` (flat CRUD with global list + modal), `src/features/Roles/` (multi-select "pill" pattern for many-to-many relations).

### Container rules
- Only `useAppDispatch` / `useAppSelector` from `../../store/hooks`
- NEVER import `apiClient` or a `*.service.ts` file directly — only dispatch thunks from the feature's `*.action.ts`
- NEVER know endpoint paths
- Forms: `useForm` + `zodResolver(theSchemaFromConstants)` from React Hook Form. On submit, the container dispatches the thunk with the already-validated data. When editing an existing record, use `reset(buildForm(existing))` (or the RHF equivalent) to populate the form

### Action rules
- Imports the feature's service (`../../api/<featureName>.service.ts`) — never `apiClient` directly
- Define, in order: action type string constants (`GET_X`, `GET_X_SUCCESS`, `GET_X_ERROR`, `SAVE_X`, `SAVE_X_SUCCESS`, `SAVE_X_ERROR`) → plain action creator functions → thunks
- Thunks typed as `ThunkAction<Promise<void>, RootState, unknown, Action>`
- Always `try/catch`; use a local `parseErrorMessage(error, fallback)` helper (copy the one in `Cities.action.ts`/`Plans.action.ts`) to extract the API's error message; `toast.error(message)` on failure, `toast.success(...)` after a successful create/update/delete
- After create/update/delete, the common pattern is to re-fetch the full list (`service.list()`) and dispatch success with the fresh array, rather than optimistically patching a single item in state

### Reducer rules
- Switch/case only, state shape `{ loading, saveLoading, error, data }` for list-style features
- Import action type constants from the feature's own `*.action.ts` (not a separate constants file, unless the feature already has one)
- No `createSlice`

### Service rules (`src/api/<featureName>.service.ts`)
- The only file that imports `apiClient` for that feature
- Exposes flat CRUD: `list()`, `create(payload)`, `update(id, payload)`, `remove(id)` — matching the NestJS backend's REST endpoints
- Types imported from the feature's `*.types.ts`

### Registration steps after scaffolding a feature
1. Add the reducer to `configureStore({ reducer: { ... } })` in `src/store/store.ts`
2. Add a route in `src/App.tsx`, wrapped as `<ProtectedRoute><DashboardLayout><XContainer /></DashboardLayout></ProtectedRoute>`
3. If it should appear in the sidebar, add an entry (icon from `lucide-react` + `path`) to `sideSections` in `src/features/Dashboard/Dashboard.constants.ts`

### Forbidden
- `fetch` anywhere — use `apiClient` via the feature's service
- `createSlice` in new reducers
- `apiClient` imported anywhere except `src/api/*.service.ts` (and `apiClient.ts` itself)
- Raw `useDispatch` / `useSelector` — use `useAppDispatch` / `useAppSelector` from `../../store/hooks`
- Skipping React Hook Form + Zod in a new feature's form
- Inline `style={{}}` or CSS modules instead of Tailwind `className`

### Auth / Navigation
- Entry point: `/login` (`Login.container.tsx`)
- `ProtectedRoute` (in `src/App.tsx`) checks `state.login.token` — redirects to `/login` if absent
- `PublicRoute` (in `src/App.tsx`) redirects to `/dashboard` if a token IS present — wraps `/login` and `/register`
- Sidebar rendered by `DashboardLayout` + `Dashboard.sidebar.tsx`, fully data-driven from `sideSections` in `Dashboard.constants.ts`

## Path alias
None configured — use relative imports (`../../store/hooks`, `../../api/x.service.ts`), matching existing features.

## Custom skills
- `/new-feature <FeatureName>` — scaffold a complete feature
- `/new-screen <FeatureName> <Role>` — add a presentational child component
- `/check-architecture` — audit for rule violations
