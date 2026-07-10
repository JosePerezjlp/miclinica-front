---
description: Audit the codebase for architecture rule violations
---

Perform a thorough audit of `src/` for violations of the architecture rules defined in CLAUDE.md.

Use Grep to check each rule below. Report every violation with: **file path**, **line number**, **rule violated**, and **suggested fix**.

## Rules to check

1. **apiClient outside service files**
   Search for `apiClient` imports in files that are NOT `src/api/*.service.ts` (and not `apiClient.ts` itself). Violation if found in containers, reducers, or anywhere in `src/features/`.

2. **axios direct import outside apiClient.ts**
   Search for `import.*from "axios"` (or `'axios'`) in any file other than `src/api/apiClient.ts`.

3. **fetch usage**
   Search for `fetch(` anywhere in `src/`. All HTTP calls must go through `apiClient` via a feature's service.

4. **createSlice**
   Search for `createSlice` anywhere in `src/`. Forbidden in new code — use manual action creators + switch reducer. The one known exception is `src/features/AffiliateGroups/AffiliateGroups.detail.reducer.ts` (legacy, predates the convention) — flag it as "known legacy exception, not to be auto-fixed" rather than a fresh violation.

5. **Raw useDispatch / useSelector**
   Search for `useDispatch(` or `useSelector(` (not `useAppDispatch`/`useAppSelector`) anywhere in `src/`. Must use the typed hooks from `../../store/hooks`.

6. **apiClient or service imports in containers**
   Search for `apiClient` or `from "../../api/` imports in `*.container.tsx` files.

7. **Endpoint paths in containers**
   Search for string literals that look like URL paths (e.g. `"/plans"`, `"/benefits"`, `` `/plans/${...}` ``) in `*.container.tsx` files — endpoint paths must live only inside `src/api/*.service.ts`.

8. **ThunkAction type on thunks**
   Check that every exported thunk (an arrow function returning `async (dispatch) => {...}`) in `*.action.ts` files is typed as `ThunkAction<Promise<void>, RootState, unknown, Action>`.

9. **try/catch + toast in thunks**
   Check that every thunk in `*.action.ts` wraps its service call in try/catch, and calls `toast.error(...)` in the catch branch.

10. **File naming convention**
    Verify every file in `src/features/<FeatureName>/` follows `<FeatureName>.<role>.(ts|tsx)` naming (matching the folder's own FeatureName prefix).

11. **Forms without React Hook Form + Zod**
    For each `*.container.tsx` that renders a create/edit form (has a modal or form with submit handling), check it uses `useForm` + `zodResolver` against a schema from its `*.constants.ts`, not a plain `useState` form object. `Cities`, `Plans`, `Benefits`, `Roles` are known pre-existing exceptions (predate this rule) — don't flag those unless asked to migrate them; flag any *other/newer* feature that skips RHF+Zod.

12. **Inline styles instead of Tailwind**
    Search for `style={{` in `.tsx` files under `src/features/` and `src/components/`. Flag any that aren't for a genuinely dynamic, non-class-expressible value.

13. **Default exports in feature containers**
    Feature container/service/action/reducer files should use named exports for their internals; only the container's default export (used by `App.tsx`'s route) is expected — verify no other unexpected default exports exist in the same feature folder.

Print a summary at the end: total violations found, grouped by rule.
