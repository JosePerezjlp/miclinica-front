---
description: Scaffold a complete feature following the MiClínica frontend architecture
---

Scaffold a new feature called `$ARGUMENTS` following the exact architecture rules in CLAUDE.md.

Read CLAUDE.md first to confirm all rules, then look at `src/features/Cities/` (or `src/features/Plans/`, `src/features/Benefits/`) as the reference implementation for the service/action/reducer/container structure, naming, and the `parseErrorMessage` helper — note that those particular features predate the RHF+Zod rule and use plain `useState` forms, so don't copy that part; the form itself must use React Hook Form + Zod as described below.

Create these files:

1. `src/api/$ARGUMENTS.service.ts` (lowerCamelCase filename) — the ONLY place that imports `apiClient` for this feature. Export an object with `list()`, `create(payload)`, `update(id, payload)`, `remove(id)`, hitting the flat REST endpoints on the NestJS backend (confirm the exact paths/DTO shape against the backend controller in `../miclinica-v2/src/modules/**` before assuming names).
2. `src/features/$ARGUMENTS/$ARGUMENTS.types.ts` — `<X>Response` interface (matching the backend entity), `Create<X>Request` / `Update<X>Request` interfaces (matching the backend DTOs).
3. `src/features/$ARGUMENTS/$ARGUMENTS.constants.ts` — the Zod schema for the create/edit form (`z.object({...})`), the inferred form type (`export type $ARGUMENTSFormValues = z.infer<typeof $ARGUMENTSSchema>`), plus any static dropdown options the feature needs.
4. `src/features/$ARGUMENTS/$ARGUMENTS.action.ts` — action type string constants (`GET_X`, `GET_X_SUCCESS`, `GET_X_ERROR`, `SAVE_X`, `SAVE_X_SUCCESS`, `SAVE_X_ERROR`) → action creators → thunks. Imports the service from step 1, never `apiClient` directly. Thunks typed `ThunkAction<Promise<void>, RootState, unknown, Action>`. Always try/catch with a `parseErrorMessage` helper + `toast.error`/`toast.success` (react-hot-toast). After create/update/delete, re-fetch the list and dispatch success with the fresh array.
5. `src/features/$ARGUMENTS/$ARGUMENTS.reducer.ts` — switch/case reducer, state shape `{ loading, saveLoading, error, data }`. Import action type constants from the action file. No `createSlice`.
6. `src/features/$ARGUMENTS/$ARGUMENTS.container.tsx` — orchestration + UI. Uses `useAppDispatch`/`useAppSelector` from `../../store/hooks`. Table/list with search + status filter, and a create/edit modal whose form uses `useForm` + `zodResolver` against the schema from step 3 — never plain `useState` for the form fields. On submit, dispatch the thunk with the already-validated data. Never imports `apiClient` or the service directly.

After creating the files:
- Add the reducer to `configureStore({ reducer: { ... } })` in `src/store/store.ts`
- Add a route in `src/App.tsx`: `<Route path="/..." element={<ProtectedRoute><DashboardLayout><XContainer /></DashboardLayout></ProtectedRoute>} />`
- If it should appear in the sidebar, add an entry (lucide-react icon + path) to `sideSections` in `src/features/Dashboard/Dashboard.constants.ts`

Strict rules to enforce:
- Tailwind `className` only — never inline `style={{}}` or CSS modules
- English identifiers everywhere, Spanish UI copy only
- `apiClient` only in `src/api/*.service.ts`
- `useAppDispatch`/`useAppSelector` only in `*.container.tsx`, never raw `useDispatch`/`useSelector`
- All thunks must have try/catch + toast on error
- No `createSlice`, no `fetch`
- The form must use React Hook Form + Zod — do not use plain `useState` for form fields
