# Pronósticos del Mundial

Pronósticos del Mundial 2026 con grupos privados, tabla transparente, bonus por favorito y carga rápida de toda la fase de grupos en una sola planilla.

## Setup

```sh
npm install
```

### Supabase

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```sh
   cp .env.example .env
   ```
2. Get values from your Supabase project dashboard (Settings → API).

### Google OAuth Setup

1. **Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Add `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**

2. **Supabase Dashboard:**
   - Go to **Authentication → Providers → Google**
   - Enable Google provider
   - Paste the Client ID and Client Secret from Google
   - Set the **Site URL** to your production URL (e.g., `https://your-domain.vercel.app`)
   - Under **Redirect URLs**, add:
     - `https://your-domain.vercel.app/api/auth/callback`
     - `http://localhost:4321/api/auth/callback` (for local dev)

3. **Vercel Environment Variables:**
   - Set `SUPABASE_URL` and `SUPABASE_KEY` in your Vercel project settings
   - Set `SITE_URL` to your production URL

### Create Tables & Seed Data

**Tables are NOT created automatically.** You must run the SQL manually:

1. Open your Supabase project dashboard → **SQL Editor**
2. Paste the contents of `supabase/schema.sql` and run it
3. If migrating from an older version, also run `supabase/migration_google_auth.sql`
4. Paste the contents of `supabase/seed.sql` and run it

This creates:
- `players` — player profiles (auth_user_id for Google login, browser_key for anonymous, name, favorite team)
- `matches` — 72 World Cup group-stage fixtures with flags and venues
- `predictions` — player predictions per match (upserted on save)

### Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro check`     | Run type checks                                  |

### Testing the Supabase connection

Hit `GET /api/supabase-status` while the dev server runs:

```sh
curl http://localhost:4321/api/supabase-status
```

### Auth-Gated UX

- **Unauthenticated users** see a sign-in prompt. Prediction inputs and save/clear buttons are disabled.
- **Authenticated users without a favorite** see the favorite-team picker modal on first login. The irreversible warning is displayed before confirming.
- **Authenticated users with a favorite** see a read-only locked state confirming their choice. The favorite cannot be changed.

### Testing the full flow

1. Start dev server: `npm run dev`
2. Open `http://localhost:4321`
3. Click "Iniciar sesión con Google" in the header
4. Complete Google OAuth flow
5. On first login, choose your favorite country (this cannot be changed later)
6. Scroll to the planilla → enter predictions for any matches → click "Guardar todo"
7. Reload the page → your predictions should persist from the server

### Reset Player State (for testing)

To test the first-login flow again, reset a player's state in Supabase SQL Editor:

```sql
-- By email (replace with actual email):
UPDATE players
SET favorite_team = '', favorite_flag = '', name = ''
WHERE email = 'user@example.com';

-- By auth_user_id (replace with Supabase UUID):
UPDATE players
SET favorite_team = '', favorite_flag = '', name = ''
WHERE auth_user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

See `supabase/reset_player.sql` for the full script with all options.

### API Endpoints

| Endpoint                  | Method | Description                                       |
| :------------------------ | :----- | :------------------------------------------------ |
| `/api/auth/signin`        | GET    | Initiate Google OAuth login                       |
| `/api/auth/callback`      | GET    | Handle OAuth redirect and exchange code for session |
| `/api/auth/session`       | GET    | Get current user session                          |
| `/api/auth/signout`       | POST   | Sign out and clear session                        |
| `/api/auth/favorite-team` | POST   | Set favorite team (first login only, irreversible) |
| `/api/bootstrap`          | GET    | Load matches, player profile, and predictions     |
| `/api/player`             | POST   | Save player profile (name, favorite team)         |
| `/api/predictions`        | POST   | Save predictions (upsert per player+match)        |
| `/api/supabase-status`    | GET    | Check Supabase connection health                  |

## Relevant Files

- `src/lib/supabase.ts` — Supabase browser + server clients (SSR-compatible)
- `src/lib/flags.ts` — Country name → emoji flag mapping
- `src/data/site.ts` — Static fixture data (matches rendered at build time)
- `src/pages/api/auth/signin.ts` — Initiate Google OAuth login
- `src/pages/api/auth/callback.ts` — Handle OAuth redirect callback
- `src/pages/api/auth/session.ts` — Get current user session
- `src/pages/api/auth/signout.ts` — Sign out and clear session
- `src/pages/api/auth/favorite-team.ts` — Set favorite team (first login only)
- `src/pages/api/bootstrap.ts` — Bootstrap endpoint (matches + player + predictions)
- `src/pages/api/player.ts` — Save player profile
- `src/pages/api/predictions.ts` — Save predictions
- `src/pages/api/supabase-status.ts` — Connection check endpoint
- `supabase/schema.sql` — Database schema (run in SQL Editor)
- `supabase/migration_google_auth.sql` — Migration for Google auth support
- `supabase/seed.sql` — Fixture seed data (run in SQL Editor)
- `.env.example` — Required env vars template
