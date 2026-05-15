# Copilot Instructions — MiClinica Front

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Redux** (manual reducers — NO RTK slices)
- **Axios** (via `src/api/apiClient.ts`)
- **React Hook Form** + **Zod** para formularios y validacion
- **react-hot-toast** para notificaciones
- **react-router-dom** para enrutamiento
- **lucide-react** para iconografia del dashboard

---

## Estrategia v0 (OPCIÓN 1)

Usamos **v0 para prototipar visual rápido** + adaptamos manualmente a nuestra arquitectura.

**Leer: [V0_INTEGRATION_GUIDE.md](../V0_INTEGRATION_GUIDE.md)**

Flujo:

1. Generar componente en v0 (React + Tailwind).
2. Copiar JSX visual.
3. Adaptar manualmente a nuestros patterns (RHF+Zod+Redux).
4. **NO pegar v0 output directo** — requiere refactorización siempre.

---

## UI / Arquitectura de componentes

- **English-only rule (mandatory):** all new code artifacts must be in English (feature names, file names, component names, interfaces/types, constants, variables, function names, comments, and route paths).
- UI copy can remain Spanish only when it is product/business text shown to end users.

- `Navbar` y `Footer` son componentes globales en `src/components/`.
- Las páginas de negocio se organizan por features en `src/features/<FeatureName>/`.
- Cada feature tiene un contenedor principal: `<FeatureName>.container.tsx`.
- La UI de cada feature debe ser **100% componetizable**: sidebar, topbar, cards, tablas, filtros, etc., en archivos separados.
- Los componentes hijos de una feature usan patrón con sufijo por rol: `<FeatureName>.<rol>.tsx`.
  - Ejemplos: `Dashboard.sidebar.tsx`, `Dashboard.topbar.tsx`, `Dashboard.metricCard.tsx`, `Dashboard.paymentCard.tsx`.
- Los tipos compartidos de la feature van en `<FeatureName>.types.ts`.
- Los datos mock/estáticos de la feature van en `<FeatureName>.constants.ts`.
- El container debe quedar limpio (solo orquestación de datos + composición), sin bloques largos de JSX inline.

Estructura recomendada por feature UI:

```
src/features/<FeatureName>/
  <FeatureName>.container.tsx
  <FeatureName>.types.ts
  <FeatureName>.constants.ts
  <FeatureName>.sidebar.tsx
  <FeatureName>.topbar.tsx
  <FeatureName>.metricCard.tsx
  <FeatureName>.table.tsx
  <FeatureName>.filters.tsx
```

---

## Estado / Arquitectura Redux

Patrón obligatorio para toda feature:

```
src/features/<Feature>/
  <Feature>.action.ts    ← ÚNICO lugar con apiClient y endpoints HTTP
  <Feature>.reducer.ts   ← solo reacciona a acciones de su action.ts
  <Feature>.container.tsx ← solo useAppDispatch / useAppSelector + dispatch de thunks
```

### Containers (`*.container.tsx`)

- Solo pueden usar `useAppDispatch` y `useAppSelector`.
- **PROHIBIDO** importar `apiClient` directamente.
- **PROHIBIDO** conocer rutas de endpoints (`/auth/login`, `/patients/...`, etc.).
- Responsabilidades: estado UI local, componer hijos presentacionales, despachar thunks.
- Para formularios, usar `useForm` + `zodResolver` (React Hook Form + Zod).
- En submit, el container despacha thunk con datos ya validados.

### Actions (`*.action.ts`)

- Es el **ÚNICO** lugar donde se usa `apiClient` y se llaman endpoints HTTP.
- Deben definir:
  - Constantes: `FEATURE_EVENT`, `FEATURE_EVENT_SUCCESS`, `FEATURE_EVENT_ERROR`
  - Action creators simples: `onFeature`, `onFeatureSuccess`, `onFeatureError`
  - Thunks: `onFeatureThunk` con tipo `ThunkAction<Promise<void>, RootState, unknown, Action>`
- Los thunks deben:
  - Usar `apiClient` para llamar a la API.
  - Manejar `try/catch` y disparar `toast.error` ante errores.
  - Aceptar callbacks `onSuccess`/`onError` opcionales.

### Reducers (`*.reducer.ts`)

- Reaccionan SÓLO a las acciones de su `*.action.ts`.
- **Sin** llamadas HTTP ni lógica de UI.

---

## Regla dura — nunca romper esto

1. Si se necesita un nuevo endpoint para una feature existente o nueva:
   - Crear/actualizar `src/features/<Feature>/<Feature>.action.ts` con el thunk.
   - Desde el container, usar solo `dispatch(onFeatureThunk({ ... }))`.
2. **Nunca** agregar `import { apiClient }` dentro de un `*.container.tsx`.  
   Si existe, mover esa lógica al action correspondiente.
3. **Nunca** crear slices de RTK (`createSlice`). Usar sólo `configureStore` con reducers manuales.
4. **Nunca** despachar fetch/axios directamente desde un componente presentacional.
5. **Siempre** validar formularios con `zod` y conectar via `@hookform/resolvers/zod`.
6. **Dashboard privado**: el usuario no autenticado no puede ver dashboard ni layout de negocio.

---

## Auth y Rutas

- Primera vista obligatoria: `/login`.
- Si hay token, `/login` y `/register` redirigen a `/dashboard`.
- Si no hay token, cualquier intento de entrar a `/dashboard` redirige a `/login`.
- El dashboard es un layout privado estilo sistema de gestion (sidebar + topbar + metricas).

---

## Convenciones de nombres

| Artefacto               | Ejemplo                  |
| ----------------------- | ------------------------ |
| Feature container       | `Home.container.tsx`     |
| Feature action          | `Home.action.ts`         |
| Feature reducer         | `Home.reducer.ts`        |
| Componente hijo por rol | `Dashboard.sidebar.tsx`  |
| Tipos de feature        | `Dashboard.types.ts`     |
| Datos de feature        | `Dashboard.constants.ts` |
| Componente global       | `Navbar.tsx`             |
| API client              | `src/api/apiClient.ts`   |
| Store                   | `src/store/store.ts`     |
| Hooks tipados           | `src/store/hooks.ts`     |

---

## Variables de entorno

- `VITE_API_URL` — base URL del backend (definida en `.env`).
- Todas las variables de entorno deben empezar con `VITE_`.
