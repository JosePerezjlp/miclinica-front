---
description: Add a presentational child component to an existing feature
---

The arguments are `<FeatureName> <Role>` (e.g. `Plans benefitPicker` creates `src/features/Plans/Plans.benefitPicker.tsx`).

Parse $ARGUMENTS as: first word = FeatureName, remaining words joined in camelCase = Role.

Create the file `src/features/<FeatureName>/<FeatureName>.<role>.tsx` as a pure presentational component.

Only do this when the parent `<FeatureName>.container.tsx` has genuinely grown too large to keep the UI inline — most CRUD features in this codebase (Cities, Plans, Benefits) keep their table and modal directly in the container, so don't split things out just for the sake of it.

Rules:
- Tailwind `className` only — never inline `style={{}}` or CSS modules
- No `useDispatch`, `useSelector`, `useAppDispatch`, `useAppSelector`
- No `apiClient` or `*.service.ts` imports
- No `axios` or `fetch`
- Props typed with a local `interface <FeatureName><Role>Props { ... }`
- English identifiers, Spanish UI copy
- Export a named function (not default export)

After creating the file, import and use it from `<FeatureName>.container.tsx` (or the appropriate parent component), passing all data and callbacks via props.
