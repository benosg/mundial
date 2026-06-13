import type { createServerClient } from "./supabase";

type SupabaseClient = ReturnType<typeof createServerClient>;

interface PlayerRow {
  id: string;
  name: string | null;
  email: string | null;
  favorite_team: string | null;
  favorite_flag: string | null;
  auth_user_id: string | null;
  created_at: string | null;
}

interface PredictionRow {
  player_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
}

interface MatchRow {
  id: string;
  home: string;
  away: string;
  home_result: number | null;
  away_result: number | null;
}

export interface PlayerPointsBreakdown {
  total_points: number;
  exact_count: number;
  winner_count: number;
  favorite_bonus_count: number;
  completed_count: number;
}

export interface RankedPlayer {
  id: string;
  name: string;
  favorite_team: string | null;
  favorite_flag: string;
  predictions_count: number;
  joined: string | null;
  auth_user_id: string | null;
  points_breakdown: PlayerPointsBreakdown;
  ranking_position: number;
}

function calcSign(a: number, b: number): number {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

export function calculatePoints(
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

export async function getRankedPlayers(supabase: SupabaseClient): Promise<{
  players: RankedPlayer[];
  error: string | null;
}> {
  const { data: players, error } = await supabase
    .from("players")
    .select("id, name, email, favorite_team, favorite_flag, auth_user_id, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return { players: [], error: error.message };
  }

  const filtered = ((players ?? []) as PlayerRow[]).filter(
    (player) => (player.name && player.name.trim()) || player.auth_user_id
  );

  const playerIds = filtered.map((player) => player.id);

  let allPredictions: PredictionRow[] = [];
  let allMatches: MatchRow[] = [];

  if (playerIds.length > 0) {
    const [predictionsResult, matchesResult] = await Promise.all([
      supabase
        .from("predictions")
        .select("player_id, match_id, home_score, away_score")
        .in("player_id", playerIds),
      supabase
        .from("matches")
        .select("id, home, away, home_result, away_result"),
    ]);

    if (predictionsResult.error) {
      return { players: [], error: predictionsResult.error.message };
    }

    if (matchesResult.error) {
      return { players: [], error: matchesResult.error.message };
    }

    allPredictions = (predictionsResult.data ?? []) as PredictionRow[];
    allMatches = (matchesResult.data ?? []) as MatchRow[];
  }

  const matchesMap: Record<string, MatchRow> = {};
  allMatches.forEach((match) => {
    matchesMap[match.id] = match;
  });

  const predictionsByPlayer: Record<string, PredictionRow[]> = {};
  allPredictions.forEach((prediction) => {
    if (!predictionsByPlayer[prediction.player_id]) predictionsByPlayer[prediction.player_id] = [];
    predictionsByPlayer[prediction.player_id].push(prediction);
  });

  const rankedPlayers = filtered.map((player) => {
    const predictions = predictionsByPlayer[player.id] || [];
    let totalPoints = 0;
    let exactCount = 0;
    let winnerCount = 0;
    let favoriteBonusCount = 0;
    let completedCount = 0;

    predictions.forEach((prediction) => {
      const match = matchesMap[prediction.match_id];
      if (!match || match.home_result === null || match.away_result === null) return;

      completedCount++;
      const points = calculatePoints(
        match.home_result,
        match.away_result,
        prediction.home_score,
        prediction.away_score,
        player.favorite_team,
        match.home,
        match.away
      );

      totalPoints += points.points;
      if (points.type === "exact") exactCount++;
      else if (points.type === "winner") winnerCount++;
      if (points.favoriteBonus) favoriteBonusCount++;
    });

    return {
      id: player.id,
      name: player.name || "Sin nombre",
      favorite_team: player.favorite_team || null,
      favorite_flag: player.favorite_flag || "🏳️",
      predictions_count: predictions.length,
      joined: player.created_at,
      auth_user_id: player.auth_user_id,
      points_breakdown: {
        total_points: totalPoints,
        exact_count: exactCount,
        winner_count: winnerCount,
        favorite_bonus_count: favoriteBonusCount,
        completed_count: completedCount,
      },
      ranking_position: 0,
    } satisfies RankedPlayer;
  });

  rankedPlayers.sort((a, b) => b.points_breakdown.total_points - a.points_breakdown.total_points);

  return {
    players: rankedPlayers.map((player, index) => ({
      ...player,
      ranking_position: index + 1,
    })),
    error: null,
  };
}

export async function getRankingPositionForAuthUser(
  supabase: SupabaseClient,
  authUserId: string
): Promise<number | null> {
  const { players, error } = await getRankedPlayers(supabase);

  if (error) {
    return null;
  }

  return players.find((player) => player.auth_user_id === authUserId)?.ranking_position ?? null;
}
