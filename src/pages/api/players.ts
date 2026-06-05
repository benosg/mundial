import type { APIRoute } from "astro";
import { createServerClient } from "../../lib/supabase";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request, url }) => {
  const playerId = url.searchParams.get("id");
  const supabase = createServerClient(request, new Headers());

  if (playerId) {
    const { data: player, error: playerErr } = await supabase
      .from("players")
      .select("id, name, favorite_team, favorite_flag, created_at")
      .eq("id", playerId)
      .single();

    if (playerErr || !player) {
      return json({ ok: false, error: "Player not found" }, 404);
    }

    const { data: predictions, error: predErr } = await supabase
      .from("predictions")
      .select("match_id, home_score, away_score")
      .eq("player_id", playerId);

    if (predErr) {
      return json({ ok: false, error: predErr.message }, 502);
    }

    return json({
      ok: true,
      player: {
        id: player.id,
        name: player.name || "Sin nombre",
        favorite_team: player.favorite_team || null,
        favorite_flag: player.favorite_flag || "🏳️",
        joined: player.created_at,
      },
      predictions: predictions ?? [],
    });
  }

  const { data: players, error } = await supabase
    .from("players")
    .select("id, name, email, favorite_team, favorite_flag, auth_user_id, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return json({ ok: false, error: error.message }, 502);
  }

  const filtered = (players ?? []).filter(
    (p) => (p.name && p.name.trim()) || p.auth_user_id
  );

  const playerIds = filtered.map((p) => p.id);

  let predictionCounts: Record<string, number> = {};

  if (playerIds.length > 0) {
    const { data: preds } = await supabase
      .from("predictions")
      .select("player_id")
      .in("player_id", playerIds);

    if (preds) {
      preds.forEach((p) => {
        predictionCounts[p.player_id] = (predictionCounts[p.player_id] || 0) + 1;
      });
    }
  }

  const result = filtered.map((p) => ({
    id: p.id,
    name: p.name || "Sin nombre",
    favorite_team: p.favorite_team || null,
    favorite_flag: p.favorite_flag || "🏳️",
    predictions_count: predictionCounts[p.id] || 0,
    joined: p.created_at,
  }));

  return json({ ok: true, players: result });
};
