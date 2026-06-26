# Mundial 2026 Pronósticos

## Stack

- Astro 6 SSR (`@astrojs/vercel`), TypeScript strict, Supabase SSR/auth/database.
- Package manager: `pnpm@11.6.0`.
- Flags are rendered from emoji → Twemoji SVG. England and Scotland need the custom subdivision-flag handling already present in the UI/helpers.

## Verified commands

```sh
corepack enable
pnpm install
pnpm dev      # http://localhost:4321
pnpm check    # astro check
pnpm build    # main verification gate for SSR/Vercel output
pnpm preview
```

- There are no tests, linter, formatter, task runner, or pre-commit hooks in this repo.
- In practice, `pnpm check` + `pnpm build` are the only real validation steps.

## Environment

- Required app vars: `SUPABASE_URL`, `SUPABASE_KEY`.
- `SITE_URL` matters for production OAuth redirects/canonicals.
- `package.json` allows Node `>=22.12.0`, but local `pnpm build` warns that Vercel functions target Node 24, not Node 25.

## Architecture that matters

- `/` is not the main UI; `src/pages/index.astro` redirects to `/groups` or `/bracket`.
- Main user flows:
  - `src/pages/groups/index.astro` → group-stage predictions
  - `src/pages/bracket.astro` → knockout bracket predictions
  - `src/pages/resultados.astro` → public results timeline
  - `src/pages/companions.astro` → ranking + player detail modal
- Hardcoded tournament data lives in `src/data/site.ts` (groups) and `src/data/knockout.ts` (bracket).
- FIFA syncing logic is in `src/lib/fifa-results.ts` + `src/lib/results-sync.ts`.
- Ranking is server-side in `src/lib/ranking.ts` and now combines group predictions and bracket predictions.

## API surface to not misread

- Group stage:
  - `/api/bootstrap`
  - `/api/predictions`
  - `/api/results/group-stage`
  - `/api/results/refresh`
- Bracket:
  - `/api/bracket/bootstrap`
  - `/api/bracket/predictions`
- Player/auth/admin:
  - `/api/players` returns ranking list and player detail by query params
  - `/api/player` is profile save/update, not ranking detail fetch
  - `/api/auth/*` handles Google OAuth/session/favorite team
  - `/api/admin/results` and `/api/admin/results/fifa-sync` are admin-only result tools

## Database / setup gotchas

- `supabase/schema.sql` is not the full setup story.
- Real setup order is: `schema.sql` → `seed.sql` → required migrations in `supabase/`.
- Important migrations include:
  - `migration_is_admin.sql` for `players.is_admin`
  - `migration_knockout_bracket.sql` for `knockout_matches` and `bracket_predictions`
- Current app data is not just `players`, `matches`, `predictions`; knockout tables are part of normal operation.

## Behavior gotchas

- Group-stage persistence still supports legacy anonymous `browser_key` players.
- Bracket persistence is auth-gated in the UI.
- Bracket editing is phase-gated: each round opens after the dependency finishes and locks 10 minutes before that round's first kickoff.
- The bracket page uses one save action in the UI, but the backend still validates/saves phase by phase.
