import type { APIRoute } from "astro";
import { createServerClient } from "../../lib/supabase";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function calcSign(a: number, b: number): number {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

function calculatePoints(
  homeResult: number | null,
  awayResult: number | null,
  homeScore: number,
  awayScore: number,
  favoriteTeam: string | null,
  homeTeam: string,
  awayTeam: string
): { points: number; type: "exact" | "winner" | "none"; favoriteBonus: boolean } {
  if (homeResult === null || awayResult === null) {
    return { points: 0, type: "none", favoriteBonus: false };
  }

  const exact = homeResult === homeScore && awayResult === awayScore;
  if (exact) {
      const favBonus = !!favoriteTeam && (favoriteTeam === homeTeam || favoriteTeam === awayTeam);
      return { points: 5 + (favBonus ? 1 : 0), type: "exact", favoriteBonus: favBonus };
  }

    const resultSign = calcSign(homeResult, awayResult);
    const predSign = calcSign(homeScore, awayScore);
    if (resultSign === predSign) {
      const favBonus = !!favoriteTeam && (favoriteTeam === homeTeam || favoriteTeam === awayTeam);
      return { points: 3 + (favBonus ? 1 : 0), type: "winner", favoriteBonus: favBonus };
    }

  return { points: 0, type: "none", favoriteBonus: false };
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

  let allPredictions: Array<{ player_id: string; match_id: string; home_score: number; away_score: number }> = [];
  let allMatches: Array<{ id: string; home: string; away: string; home_result: number | null; away_result: number | null }> = [];

  if (playerIds.length > 0) {
    const [predResult, matchesResult] = await Promise.all([
      supabase
        .from("predictions")
        .select("player_id, match_id, home_score, away_score")
        .in("player_id", playerIds),
      supabase
        .from("matches")
        .select("id, home, away, home_result, away_result"),
    ]);

    allPredictions = predResult.data ?? [];
    allMatches = matchesResult.data ?? [];
  }

  const matchesMap: Record<string, any> = {};
  allMatches.forEach((m) => {
    matchesMap[m.id] = m;
  });

  const predictionsByPlayer: Record<string, typeof allPredictions> = {};
  allPredictions.forEach((p) => {
    if (!predictionsByPlayer[p.player_id]) predictionsByPlayer[p.player_id] = [];
    predictionsByPlayer[p.player_id].push(p);
  });

  const result = filtered.map((p) => {
    const preds = predictionsByPlayer[p.id] || [];
    let totalPoints = 0;
    let exactCount = 0;
    let winnerCount = 0;
    let favoriteBonusCount = 0;
    let completedCount = 0;

    preds.forEach((pred) => {
      const match = matchesMap[pred.match_id];
      if (!match || match.home_result === null || match.away_result === null) return;

      completedCount++;
      const result = calculatePoints(
        match.home_result,
        match.away_result,
        pred.home_score,
        pred.away_score,
        p.favorite_team,
        match.home,
        match.away
      );

      totalPoints += result.points;
      if (result.type === "exact") exactCount++;
      else if (result.type === "winner") winnerCount++;
      if (result.favoriteBonus) favoriteBonusCount++;
    });

    return {
      id: p.id,
      name: p.name || "Sin nombre",
      favorite_team: p.favorite_team || null,
      favorite_flag: p.favorite_flag || "🏳️",
      predictions_count: preds.length,
      joined: p.created_at,
      points_breakdown: {
        total_points: totalPoints,
        exact_count: exactCount,
        winner_count: winnerCount,
        favorite_bonus_count: favoriteBonusCount,
        completed_count: completedCount,
      },
    };
  });

  result.sort((a, b) => b.points_breakdown.total_points - a.points_breakdown.total_points);

  return json({ ok: true, players: result });
};