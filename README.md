# ⚽ Pronósticos del Mundial 2026

App de pronósticos para el Mundial 2026 — grupos privados, puntaje transparente, bonus por equipo favorito y planilla para toda la fase de grupos.

**Stack**: Astro 6.4 (SSR) + Supabase (auth + DB) + Vercel

---

## Setup rápido

```sh
corepack enable
pnpm install
cp .env.example .env   # llena SUPABASE_URL y SUPABASE_KEY
```

### Base de datos

Las tablas **no se crean automáticamente**. Corre en el SQL Editor de Supabase:

1. `supabase/schema.sql` — estructura (players, matches, predictions)
2. `supabase/seed.sql` — 72 partidos de fase de grupos

### Autenticación Google OAuth

1. **Google Cloud Console** → credenciales OAuth 2.0 → redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** → Authentication → Providers → Google → pega Client ID/Secret
3. Agrega a redirect URLs: `https://tu-dominio.vercel.app/api/auth/callback` y `http://localhost:4321/api/auth/callback`

### Variables de entorno

| Variable | ¿Requerida? | Uso |
|----------|-------------|-----|
| `SUPABASE_URL` | sí | URL del proyecto Supabase |
| `SUPABASE_KEY` | sí | Key anónima/publicable |
| `SITE_URL` | sí (prod) | Redirect OAuth + canonical (lo setea Vercel) |

---

## Desarrollo

```sh
pnpm dev       # → http://localhost:4321
pnpm build     # build SSR para Vercel
pnpm preview   # preview local del build
pnpm check     # type checking
```

No hay tests, linter ni formateador configurados en el repo.

### Verificar conexión Supabase

```sh
curl http://localhost:4321/api/supabase-status
```

---

## Arquitectura

### Flujo de datos

```
src/data/site.ts (72 partidos hardcodeados)
       ↓
   FIFA API (api.fifa.com) → polling cada 60s → tabla matches
       ↓
   Usuarios ingresan pronósticos → tabla predictions (upsert)
       ↓
   src/lib/ranking.ts → cálculo server-side de puntajes
```

- **Fixtures**: Hardcodeados en `src/data/site.ts` (grupos A–L, info de broadcast chileno)
- **Resultados**: Polling desde FIFA API cada 60s, throttle por sesión (caché de 60s)
- **Pronósticos**: Upsert por `player_id + match_id`
- **Ranking**: Calculado en cada request desde `src/lib/ranking.ts`

### Puntaje

| Tipo | Ptos | Condición |
|------|------|-----------|
| Exacto | 5 | Marcador exacto |
| Ganador | 3 | Signo (gana/pierde/empata) acertado |
| Bonus favorito | +1 | Si juega tu equipo favorito y el pronóstico sumó puntos |
| Falla | 0 | Signo no acertado |

### Auth

- Google OAuth vía Supabase. Sesión en cookies HTTP.
- `getSessionContext(Astro.request)` → `{ user, isAdmin, rankingPosition }`
- Admin: columna `players.is_admin` en Supabase
- Usuarios pueden jugar sin auth (legacy `browser_key`) pero la experiencia completa requiere login

### Mobile

- Breakpoints: **960px** (layout columnar) y **640px** (columnas ocultas, padding reducido)
- Tabla de pronósticos: 4 columnas desktop → 2 en mobile (se oculta Sede a ≤960px, Chile a ≤640px)
- Ranking: 9 columnas desktop → 5 en mobile (se ocultan Exactos/Ganador/Bonus a ≤960px, Favorito a ≤640px)

---

## API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/bootstrap` | GET | Matches + player + predictions (auth o browser-key) |
| `/api/players` | GET | Lista completa de jugadores rankeados |
| `/api/player` | POST | Guardar perfil |
| `/api/predictions` | POST/DELETE | Guardar/limpiar pronósticos |
| `/api/results/refresh` | GET | Forzar sync con FIFA (throttle 60s) |
| `/api/auth/signin` | GET | Iniciar Google OAuth |
| `/api/auth/callback` | GET | Callback OAuth |
| `/api/auth/session` | GET | Sesión actual |
| `/api/auth/signout` | POST | Cerrar sesión |
| `/api/auth/favorite-team` | POST | Elegir equipo favorito (irreversible) |

---

## Admin

Los usuarios con `players.is_admin = true` ven un link "Admin" en la navegación y pueden acceder a `/admin/results` para importar resultados FIFA manualmente.

---

## Flujo completo de prueba

1. `pnpm dev`
2. Abrir `http://localhost:4321`
3. "Iniciar sesión con Google" en el header
4. Primer login → elegir país favorito (⚠️ irreversible)
5. Ingresar pronósticos → "Guardar todo"
6. Recargar → los pronósticos persisten desde el servidor

### Reset para testing

```sql
-- en Supabase SQL Editor
UPDATE players SET favorite_team = '', favorite_flag = '', name = ''
WHERE email = 'user@example.com';
```

O usa `supabase/reset_player.sql`.

---

## Estructura del proyecto

```
src/
├── data/site.ts          — fixtures, reglas, ejemplos de puntaje
├── lib/
│   ├── supabase.ts       — clientes browser/server para Supabase
│   ├── session.ts        — lectura de sesión desde cookies
│   ├── ranking.ts        — cálculo de puntajes y ranking
│   ├── fifa-results.ts   — fetch de resultados desde FIFA API
│   ├── results-sync.ts   — sincronización con throttle y caché
│   └── flags.ts          — mapeo país → emoji (vía Twemoji SVG)
├── layouts/Layout.astro  — layout global con nav y auth slot
├── pages/
│   ├── index.astro       — home: planilla + standings + ranking
│   ├── companions.astro  — ranking completo con detalle de jugador
│   ├── admin/results.astro — importación manual de resultados FIFA
│   └── api/*             — endpoints REST
└── styles/global.css     — todos los estilos globales
supabase/
├── schema.sql            — esquema de base de datos
├── seed.sql              — datos de fixtures
└── migration_*.sql       — migraciones
```
