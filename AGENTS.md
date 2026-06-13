# Mundial 2026 Pronósticos

## Stack

- **Astro 6.4** — SSR (`output: 'server'`), Vercel adapter
- **Supabase** — auth (Google OAuth), database, cookie-based SSR client (custom, not `@astrojs/db`)
- **TypeScript** — strict via `astro/tsconfigs/strict`
- **Flags** — emoji-based via Twemoji SVG (not image files)

## Development

```sh
npm run dev       # astro dev → http://localhost:4321
npm run build     # astro build (SSR output for Vercel)
npm run preview   # astro preview
```

No tests configured. No linter/formatter config in repo.

Type checking (not in scripts — run explicitly):
```sh
npx astro check
```

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_KEY` | yes | Supabase anon/publishable key |
| `SITE_URL` | yes (production) | OAuth redirect + canonical URLs (set by Vercel) |

## Architecture

### Data flow

1. **Fixtures** — hardcoded in `src/data/site.ts` (72 matches, groups A–L, Chilean broadcast info)
2. **Results** — polled from FIFA API (`api.fifa.com`) every 60s, stored in `matches` table, throttled per-session
3. **Predictions** — user-submitted scores per match, upserted to `predictions` table
4. **Ranking** — computed server-side in `src/lib/ranking.ts` from predictions + match results

### Routes

| Path | Purpose |
|------|---------|
| `/` | Home — prediction sheet + standings + ranking sidebar |
| `/companions` | Full ranking table with player detail modal |
| `/matches/1` | Per-player match view |
| `/admin/results` | Admin: import FIFA results manually |
| `/api/bootstrap` | Load matches, player, predictions (authenticated or browser-key) |
| `/api/players` | Full ranked player list |
| `/api/player` | Single player detail + predictions |
| `/api/predictions` | Save/clear predictions |
| `/api/results/refresh` | Trigger FIFA results sync |
| `/api/auth/*` | OAuth signin, callback, signout, session, favorite-team |

### Auth

- Google OAuth via Supabase. Session stored in HTTP cookies.
- `getSessionContext(Astro.request)` in `src/lib/session.ts` — returns `{ user, isAdmin, rankingPosition }`
- Admin flag: `players.is_admin` column in Supabase

### Scoring

| Type | Points | Condition |
|------|--------|-----------|
| Exact | 5 | Home and away scores match exactly |
| Winner | 3 | Sign (win/loss/draw) matches but not exact |
| Favorite bonus | +1 | If the player's favorite team played and the prediction scored |
| Miss | 0 | Sign doesn't match |

Calculated in `src/lib/ranking.ts` — `calculatePoints()`.

### Database (Supabase)

**Tables**: `players`, `matches`, `predictions`
- Predictions use `ON CONFLICT (player_id, match_id)` for upsert
- Player identity: `auth_user_id` (Google) or `browser_key` (anonymous legacy)
- Match IDs: stable keys like `A1`, `B3` — shared between `src/data/site.ts` and DB

Schema in `supabase/schema.sql`. Migration files in `supabase/`.

### Match ID format

`{group_letter}{number}` — e.g. `A1`, `B3`, `L6`. First char is the group letter (A–L), rest is a sequential number unique within the group.

## Styling

- `src/styles/global.css` — all global styles, mobile at 960px and 640px
- Mobile breakpoints: `960px` (layout collapse, table columns hidden) and `640px` (further column reduction, smaller padding)
- Prediction table: 4 columns desktop → 2 columns on mobile (hide Sede at ≤960px, hide Chile at ≤640px)
- Companion ranking: 9 columns → 5 on small mobile (hide Exactos/Ganador/Bonus at ≤960px, hide Favorito at ≤640px)
