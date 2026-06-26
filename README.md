# ⚽ Pronósticos del Mundial 2026

App de pronósticos del Mundial 2026 construida con **Astro SSR + Supabase + Vercel**.

Incluye:
- fase de grupos (`/groups`)
- llave eliminatoria (`/bracket`)
- resultados públicos (`/resultados`)
- ranking y detalle de jugadores (`/companions`)

> `src/pages/index.astro` no es la UI principal: redirige a `/groups` o `/bracket`.

---

## Stack

- Astro 6 SSR (`@astrojs/vercel`)
- TypeScript strict
- Supabase SSR/auth/database
- pnpm `11.6.0`

---

## Setup rápido

```sh
corepack enable
pnpm install
cp .env.example .env
```

Completa al menos:
- `SUPABASE_URL`
- `SUPABASE_KEY`

`SITE_URL` importa en producción para OAuth y canonicals.

---

## Base de datos

Las tablas no se crean solas. El orden real de setup es:

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. migraciones necesarias dentro de `supabase/`

Importantes:
- `migration_is_admin.sql` → agrega `players.is_admin`
- `migration_knockout_bracket.sql` → agrega `knockout_matches` y `bracket_predictions`

La app actual no usa solo `players`, `matches` y `predictions`; la llave eliminatoria forma parte normal de la operación.

---

## Google OAuth

1. En Google Cloud Console crea credenciales OAuth 2.0.
2. En Supabase activa Google en **Authentication → Providers**.
3. Usa como callback Supabase:
   - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Agrega redirect URLs de la app:
   - `http://localhost:4321/api/auth/callback`
   - `https://tu-dominio.vercel.app/api/auth/callback`

---

## Desarrollo

```sh
pnpm dev      # http://localhost:4321
pnpm check    # astro check
pnpm build    # verificación principal SSR/Vercel
pnpm preview
```

No hay tests, linter, formatter, task runner ni hooks en este repo.

En la práctica, los únicos gates reales son:
- `pnpm check`
- `pnpm build`

> `package.json` permite Node `>=22.12.0`, pero `pnpm build` advierte que Vercel Functions apunta a Node 24 si corres localmente con Node 25.

---

## Arquitectura útil

### Páginas principales

- `/groups` → pronósticos de fase de grupos
- `/bracket` → pronósticos de llave eliminatoria
- `/resultados` → timeline público de resultados
- `/companions` → ranking + modal de detalle del jugador
- `/admin/results` → edición/admin de resultados

### Datos y lógica

- `src/data/site.ts` → partidos y metadata de fase de grupos
- `src/data/knockout.ts` → metadata fija de la llave
- `src/lib/fifa-results.ts` + `src/lib/results-sync.ts` → sync con FIFA
- `src/lib/ranking.ts` → ranking server-side
- `src/lib/knockout.ts` → ventanas, bloqueo y scoring de llave
- `src/lib/group-standings.ts` → tabla de grupos reutilizable para lógica de cruces probables

### Comportamientos importantes

- La fase de grupos todavía soporta jugadores legacy por `browser_key`.
- La llave eliminatoria requiere login para persistir pronósticos.
- `/bracket` muestra cruces probables de 16vos antes de FIFA usando la tabla local de grupos.
- Si FIFA o la base ya tienen el cruce oficial, eso tiene prioridad sobre el cruce probable.
- La edición de cada ronda de la llave se abre cuando termina la fase anterior y se cierra **10 minutos antes** del primer partido de esa ronda.
- En la UI de llaves hay un solo botón **Guardar llave**, pero el backend sigue validando/guardando fase por fase.

---

## APIs que conviene no confundir

### Fase de grupos

- `GET /api/bootstrap`
- `POST /api/predictions`
- `DELETE /api/predictions`
- `GET /api/results/group-stage`
- `GET /api/results/refresh`

### Llave

- `GET /api/bracket/bootstrap`
- `POST /api/bracket/predictions`

### Jugador / auth / admin

- `GET /api/players` → ranking y detalle por query params
- `POST /api/player` → guardar/actualizar perfil
- `GET|POST /api/auth/*` → signin, callback, session, signout, favorite-team
- `GET|POST /api/admin/results`
- `GET /api/admin/results/fifa-sync`
- `GET /api/supabase-status`

---

## Verificación manual útil

### Estado de Supabase

```sh
curl http://localhost:4321/api/supabase-status
```

### Flujo rápido

1. `pnpm dev`
2. abrir `http://localhost:4321/groups`
3. probar login Google
4. guardar pronósticos de grupos
5. abrir `/bracket`
6. guardar la llave
7. abrir `/companions` para revisar ranking/detalle

---

## Estructura corta

```text
src/
  data/
    site.ts
    knockout.ts
  lib/
    fifa-results.ts
    results-sync.ts
    ranking.ts
    knockout.ts
    group-standings.ts
    supabase.ts
    session.ts
  pages/
    index.astro
    groups/index.astro
    bracket.astro
    resultados.astro
    companions.astro
    admin/results.astro
    api/**
supabase/
  schema.sql
  seed.sql
  migration_*.sql
```
