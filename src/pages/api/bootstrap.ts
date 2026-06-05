import type { APIRoute } from "astro";
import { createServerClient } from "../../lib/supabase";
import { getFlag } from "../../lib/flags";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request, url }) => {
  const browserKey = url.searchParams.get("player_id");

  const supabase = createServerClient(request, new Headers());

  // Check for authenticated session
  const { data: { session } } = await supabase.auth.getSession();

  let player = null;

  if (session) {
    // Authenticated flow — look up by auth_user_id
    const { data: authPlayer, error: authErr } = await supabase
      .from("players")
      .select("*")
      .eq("auth_user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (authErr && authErr.code !== "PGRST116") {
      return json({ ok: false, error: authErr.message }, 502);
    }

    if (authPlayer) {
      player = authPlayer;
    } else {
      // Create a stub player for this authenticated user
      const { data: created, error: createErr } = await supabase
        .from("players")
        .insert({
          auth_user_id: session.user.id,
          browser_key: "",
          name: session.user.user_metadata?.full_name || "",
          email: session.user.email || "",
          favorite_team: "",
          favorite_flag: "",
        })
        .select();

      if (createErr) {
        return json({ ok: false, error: createErr.message }, 502);
      }
      player = created?.[0] ?? null;
    }
  } else if (browserKey) {
    // Anonymous browser-key flow (backward compatibility)
    const { data: playerResult, error: playerErr } = await supabase
      .from("players")
      .select("*")
      .eq("browser_key", browserKey)
      .order("created_at", { ascending: false })
      .limit(1);

    if (playerErr) {
      return json({ ok: false, error: playerErr.message }, 502);
    }

    player = playerResult?.[0] ?? null;

    if (!player) {
      const { data: created, error: createErr } = await supabase
        .from("players")
        .insert({ browser_key: browserKey, name: "", favorite_team: "", favorite_flag: "" })
        .select();

      if (createErr) {
        return json({ ok: false, error: createErr.message }, 502);
      }
      player = created?.[0] ?? null;
    }
  }

  const [matchesResult, predResult] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .order('"group"')
      .order("id"),
    player
      ? supabase
          .from("predictions")
          .select("match_id, home_score, away_score")
          .eq("player_id", player.id)
      : Promise.resolve({ data: [] as Array<{ match_id: string; home_score: number; away_score: number }> }),
  ]);

  if (matchesResult.error) {
    return json({ ok: false, error: matchesResult.error.message }, 502);
  }

  const matches = (matchesResult.data ?? []).map((m) => ({
    id: m.id,
    group: m.group,
    home: m.home,
    home_flag: m.home_flag || getFlag(m.home),
    away: m.away,
    away_flag: m.away_flag || getFlag(m.away),
    kickoff_chile: m.kickoff_chile,
    venue: m.venue,
    city: m.city,
    broadcasters: m.broadcasters,
    home_result: m.home_result,
    away_result: m.away_result,
  }));

  return json({
    ok: true,
    player: player
      ? {
          id: player.id,
          name: player.name,
          favorite_team: player.favorite_team,
          favorite_flag: player.favorite_flag,
        }
      : null,
    matches,
    predictions: predResult.data ?? [],
  });
};
