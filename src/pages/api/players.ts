import type { APIRoute } from "astro";
import { calculatePoints, getRankedPlayers } from "../../lib/ranking";
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

    const matchIds = (predictions ?? []).map((p) => p.match_id);
    let matchesMap: Record<string, any> = {};

    if (matchIds.length > 0) {
      const { data: matches } = await supabase
        .from("matches")
        .select("id, home, away, home_result, away_result")
        .in("id", matchIds);

      (matches ?? []).forEach((m) => {
        matchesMap[m.id] = m;
      });
    }

    let totalPoints = 0;
    let exactCount = 0;
    let winnerCount = 0;
    let favoriteBonusCount = 0;
    let completedCount = 0;

    const predictionsWithPoints = (predictions ?? []).map((p) => {
      const match = matchesMap[p.match_id];
      if (!match || match.home_result === null || match.away_result === null) {
        return { ...p, points: 0, type: "pending" as const, favoriteBonus: false };
      }

      completedCount++;
      const result = calculatePoints(
        match.home_result,
        match.away_result,
        p.home_score,
        p.away_score,
        player.favorite_team,
        match.home,
        match.away
      );

      totalPoints += result.points;
      if (result.type === "exact") exactCount++;
      else if (result.type === "winner") winnerCount++;
      if (result.favoriteBonus) favoriteBonusCount++;

      return { ...p, points: result.points, type: result.type, favoriteBonus: result.favoriteBonus };
    });

    return json({
      ok: true,
      player: {
        id: player.id,
        name: player.name || "Sin nombre",
        favorite_team: player.favorite_team || null,
        favorite_flag: player.favorite_flag || "🏳️",
        joined: player.created_at,
      },
      predictions: predictionsWithPoints,
      pointsBreakdown: {
        total_points: totalPoints,
        exact_count: exactCount,
        winner_count: winnerCount,
        favorite_bonus_count: favoriteBonusCount,
        completed_count: completedCount,
      },
    });
  }

  const { players, error } = await getRankedPlayers(supabase);

  if (error) {
    return json({ ok: false, error }, 502);
  }

  return json({
    ok: true,
    players: players.map(({ auth_user_id: _authUserId, ranking_position: _rankingPosition, ...player }) => player),
  });
};
