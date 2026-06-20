import { calculateKnockoutPoints, type WinnerSide } from "./knockout";
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

interface BracketPredictionRow extends PredictionRow {
  penalties_winner: WinnerSide | null;
}

interface MatchRow {
  id: string;
  home: string;
  away: string;
  home_result: number | null;
  away_result: number | null;
}

interface KnockoutMatchRow {
  id: string;
  home_team: string | null;
  away_team: string | null;
  home_slot: string;
  away_slot: string;
  home_result: number | null;
  away_result: number | null;
  penalties_winner: WinnerSide | null;
}

export interface PlayerPointsBreakdown {
  total_points: number;
  group_points: number;
  bracket_points: number;
  exact_count: number;
  winner_count: number;
  draw_count: number;
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
  ranking_tie_count: number;
}

const RANKING_CACHE_TTL_MS = 10_000;
let rankingCache: { createdAt: number; players: RankedPlayer[] } | null = null;

export function clearRankingCache() {
  rankingCache = null;
}

function applyCompetitionRanking(players: RankedPlayer[]): RankedPlayer[] {
  const tieCounts = players.reduce<Record<number, number>>((counts, player) => {
    const points = player.points_breakdown.total_points;
    counts[points] = (counts[points] ?? 0) + 1;
    return counts;
  }, {});
  let previousPoints: number | null = null;
  let currentPosition = 0;

  return players.map((player, index) => {
    const points = player.points_breakdown.total_points;

    if (previousPoints === null || points !== previousPoints) {
      currentPosition = index + 1;
      previousPoints = points;
    }

    return {
      ...player,
      ranking_position: currentPosition,
      ranking_tie_count: tieCounts[points] ?? 1,
    };
  });
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
): { points: number; type: "exact" | "winner" | "draw" | "none"; favoriteBonus: boolean } {
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
    return {
      points: 3 + (favBonus ? 1 : 0),
      type: resultSign === 0 ? "draw" : "winner",
      favoriteBonus: favBonus,
    };
  }

  return { points: 0, type: "none", favoriteBonus: false };
}

export async function getRankedPlayers(supabase: SupabaseClient): Promise<{
  players: RankedPlayer[];
  error: string | null;
}> {
  if (rankingCache && Date.now() - rankingCache.createdAt < RANKING_CACHE_TTL_MS) {
    return { players: rankingCache.players, error: null };
  }

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
  let allBracketPredictions: BracketPredictionRow[] = [];
  let allKnockoutMatches: KnockoutMatchRow[] = [];

  if (playerIds.length > 0) {
    const [predictionsResult, matchesResult, bracketPredictionsResult, knockoutMatchesResult] = await Promise.all([
      supabase
        .from("predictions")
        .select("player_id, match_id, home_score, away_score")
        .in("player_id", playerIds),
      supabase
        .from("matches")
        .select("id, home, away, home_result, away_result"),
      supabase
        .from("bracket_predictions")
        .select("player_id, match_id, home_score, away_score, penalties_winner")
        .in("player_id", playerIds),
      supabase
        .from("knockout_matches")
        .select("id, home_team, away_team, home_slot, away_slot, home_result, away_result, penalties_winner"),
    ]);

    if (predictionsResult.error) {
      return { players: [], error: predictionsResult.error.message };
    }

    if (matchesResult.error) {
      return { players: [], error: matchesResult.error.message };
    }

    if (bracketPredictionsResult.error) {
      return { players: [], error: bracketPredictionsResult.error.message };
    }

    if (knockoutMatchesResult.error) {
      return { players: [], error: knockoutMatchesResult.error.message };
    }

    allPredictions = (predictionsResult.data ?? []) as PredictionRow[];
    allMatches = (matchesResult.data ?? []) as MatchRow[];
    allBracketPredictions = (bracketPredictionsResult.data ?? []) as BracketPredictionRow[];
    allKnockoutMatches = (knockoutMatchesResult.data ?? []) as KnockoutMatchRow[];
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

  const knockoutMatchesMap: Record<string, KnockoutMatchRow> = {};
  allKnockoutMatches.forEach((match) => {
    knockoutMatchesMap[match.id] = match;
  });

  const bracketPredictionsByPlayer: Record<string, BracketPredictionRow[]> = {};
  allBracketPredictions.forEach((prediction) => {
    if (!bracketPredictionsByPlayer[prediction.player_id]) bracketPredictionsByPlayer[prediction.player_id] = [];
    bracketPredictionsByPlayer[prediction.player_id].push(prediction);
  });

  const rankedPlayers = filtered.map((player) => {
    const predictions = predictionsByPlayer[player.id] || [];
    const bracketPredictions = bracketPredictionsByPlayer[player.id] || [];
    let totalPoints = 0;
    let groupPoints = 0;
    let bracketPoints = 0;
    let exactCount = 0;
    let winnerCount = 0;
    let drawCount = 0;
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
      groupPoints += points.points;
      if (points.type === "exact") exactCount++;
      else if (points.type === "winner") winnerCount++;
      else if (points.type === "draw") drawCount++;
      if (points.favoriteBonus) favoriteBonusCount++;
    });

    bracketPredictions.forEach((prediction) => {
      const match = knockoutMatchesMap[prediction.match_id];
      if (!match) return;

      const points = calculateKnockoutPoints(
        match.home_result,
        match.away_result,
        match.penalties_winner,
        prediction
      );

      if (match.home_result === null || match.away_result === null) return;
      if (match.home_result === match.away_result && !match.penalties_winner) return;

      completedCount++;
      totalPoints += points.points;
      bracketPoints += points.points;
      if (points.type === "exact") exactCount++;
      else if (points.type === "winner") winnerCount++;
    });

    return {
      id: player.id,
      name: player.name || "Sin nombre",
      favorite_team: player.favorite_team || null,
      favorite_flag: player.favorite_flag || "🏳️",
      predictions_count: predictions.length + bracketPredictions.length,
      joined: player.created_at,
      auth_user_id: player.auth_user_id,
      points_breakdown: {
        total_points: totalPoints,
        group_points: groupPoints,
        bracket_points: bracketPoints,
        exact_count: exactCount,
        winner_count: winnerCount,
        draw_count: drawCount,
        favorite_bonus_count: favoriteBonusCount,
        completed_count: completedCount,
      },
      ranking_position: 0,
      ranking_tie_count: 1,
    } satisfies RankedPlayer;
  });

  rankedPlayers.sort((a, b) => b.points_breakdown.total_points - a.points_breakdown.total_points);
  const rankedWithPositions = applyCompetitionRanking(rankedPlayers);
  rankingCache = { createdAt: Date.now(), players: rankedWithPositions };

  return {
    players: rankedWithPositions,
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
