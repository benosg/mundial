import { groupedMatches } from "../data/site";

const FIFA_MATCHES_URL = "https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023";
const FIFA_LIVE_MATCH_URL = "https://api.fifa.com/api/v3/live/football";
const GROUP_STAGE_NAME = "First Stage";
const GOAL_SCORERS_CACHE_TTL_MS = 10 * 60_000;
const GOAL_SCORERS_CONCURRENCY = 6;

type FifaLocalizedField = Array<{
  Description?: string;
}>;

type FifaMatch = {
  IdCompetition?: string;
  IdSeason?: string;
  IdStage?: string;
  IdMatch?: string;
  MatchNumber?: number;
  Date?: string;
  GroupName?: FifaLocalizedField;
  StageName?: FifaLocalizedField;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
};

type FifaMatchesResponse = {
  Results?: FifaMatch[];
};

type GoalSide = "home" | "away";

type FifaLiveGoal = {
  Type?: number | null;
  IdPlayer?: string | null;
  Minute?: string | null;
  Period?: number | null;
};

type FifaLivePlayer = {
  IdPlayer?: string | null;
  PlayerName?: FifaLocalizedField;
  ShortName?: FifaLocalizedField;
};

type FifaLiveTeam = {
  Players?: FifaLivePlayer[];
  Goals?: FifaLiveGoal[];
};

type FifaLiveMatchResponse = {
  HomeTeam?: FifaLiveTeam;
  AwayTeam?: FifaLiveTeam;
};

export type FifaSyncCandidate = {
  id: string;
  group: string;
  home_result: number;
  away_result: number;
  fifaCompetitionId: string | null;
  fifaSeasonId: string | null;
  fifaStageId: string | null;
  fifaMatchId: string | null;
  fifaDate: string | null;
};

export type FifaGoalType = "goal" | "penalty" | "own_goal";

export type FifaGoalScorer = {
  side: GoalSide;
  minute: string;
  name: string;
  type: FifaGoalType;
};

export type FifaGoalScorersByMatch = Record<string, FifaGoalScorer[]>;

export type FifaSyncSummary = {
  imported: number;
  suspiciousGroups: string[];
  candidates: FifaSyncCandidate[];
};

type GoalScorersCacheEntry = {
  fetchedAt: number;
  scoreKey: string;
  goals: FifaGoalScorer[];
};

const goalScorersCache = new Map<string, GoalScorersCacheEntry>();

function getLocalizedDescription(field?: FifaLocalizedField): string {
  return field?.find((item) => item?.Description)?.Description?.trim() ?? "";
}

function normalizePlayerName(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  return trimmed
    .toLocaleLowerCase("es-CL")
    .replace(/(^|[\s'-])(\p{L})/gu, (_, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase("es-CL")}`);
}

function getGroupLetter(match: FifaMatch): string | null {
  const groupName = getLocalizedDescription(match.GroupName);
  const matched = /^Group\s+([A-Z])$/i.exec(groupName);
  return matched?.[1]?.toUpperCase() ?? null;
}

function isGroupStageMatch(match: FifaMatch): boolean {
  return getLocalizedDescription(match.StageName) === GROUP_STAGE_NAME;
}

function hasNumericFinalScore(match: FifaMatch): match is FifaMatch & { HomeTeamScore: number; AwayTeamScore: number } {
  return Number.isInteger(match.HomeTeamScore) && Number.isInteger(match.AwayTeamScore);
}

function sortMatchesChronologically(matches: FifaMatch[]) {
  return [...matches].sort((left, right) => {
    const leftTime = left.Date ? Date.parse(left.Date) : Number.NaN;
    const rightTime = right.Date ? Date.parse(right.Date) : Number.NaN;

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
      return (left.MatchNumber ?? Number.MAX_SAFE_INTEGER) - (right.MatchNumber ?? Number.MAX_SAFE_INTEGER);
    }

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    if ((left.MatchNumber ?? 0) !== (right.MatchNumber ?? 0)) {
      return (left.MatchNumber ?? 0) - (right.MatchNumber ?? 0);
    }

    return String(left.IdMatch ?? "").localeCompare(String(right.IdMatch ?? ""));
  });
}

function buildLiveMatchUrl(candidate: FifaSyncCandidate) {
  if (!candidate.fifaCompetitionId || !candidate.fifaSeasonId || !candidate.fifaStageId || !candidate.fifaMatchId) {
    return null;
  }

  return [
    FIFA_LIVE_MATCH_URL,
    encodeURIComponent(candidate.fifaCompetitionId),
    encodeURIComponent(candidate.fifaSeasonId),
    encodeURIComponent(candidate.fifaStageId),
    `${encodeURIComponent(candidate.fifaMatchId)}?language=en`,
  ].join("/");
}

function getCandidateScoreKey(candidate: FifaSyncCandidate) {
  return `${candidate.home_result}-${candidate.away_result}-${candidate.fifaMatchId ?? "no-fifa-id"}`;
}

function resolveGoalType(type: number | null | undefined): FifaGoalType {
  if (type === 1) return "penalty";
  if (type === 3) return "own_goal";
  return "goal";
}

function buildPlayerNamesById(liveMatch: FifaLiveMatchResponse) {
  const playerNames = new Map<string, string>();

  [liveMatch.HomeTeam, liveMatch.AwayTeam].forEach((team) => {
    (team?.Players ?? []).forEach((player) => {
      if (!player.IdPlayer) return;

      const name = getLocalizedDescription(player.ShortName) || getLocalizedDescription(player.PlayerName);
      if (name) {
        playerNames.set(player.IdPlayer, normalizePlayerName(name));
      }
    });
  });

  return playerNames;
}

function parseGoalMinute(minute: string) {
  const matched = minute.match(/^(\d+)'(?:\+(\d+)')?$/);
  if (!matched) {
    return { base: Number.MAX_SAFE_INTEGER, extra: 0 };
  }

  return {
    base: Number(matched[1]),
    extra: matched[2] ? Number(matched[2]) : 0,
  };
}

function sortGoals(left: FifaGoalScorer & { period: number }, right: FifaGoalScorer & { period: number }) {
  const leftMinute = parseGoalMinute(left.minute);
  const rightMinute = parseGoalMinute(right.minute);

  return (
    left.period - right.period ||
    leftMinute.base - rightMinute.base ||
    leftMinute.extra - rightMinute.extra ||
    left.name.localeCompare(right.name)
  );
}

function extractGoalsForSide(
  side: GoalSide,
  team: FifaLiveTeam | undefined,
  playerNames: Map<string, string>,
): Array<FifaGoalScorer & { period: number }> {
  return (team?.Goals ?? [])
    .map((goal) => {
      const type = resolveGoalType(goal.Type);
      const playerName = goal.IdPlayer ? playerNames.get(goal.IdPlayer) : null;
      const name = playerName || (type === "own_goal" ? "Autogol" : "Gol");
      const minute = goal.Minute?.trim();

      if (!minute) return null;

      return {
        side,
        minute,
        name,
        type,
        period: Number.isInteger(goal.Period) ? Number(goal.Period) : Number.MAX_SAFE_INTEGER,
      };
    })
    .filter((goal): goal is FifaGoalScorer & { period: number } => goal !== null);
}

async function fetchGoalScorersForCandidate(candidate: FifaSyncCandidate): Promise<FifaGoalScorer[]> {
  if (candidate.home_result + candidate.away_result === 0) {
    return [];
  }

  const cacheKey = candidate.id;
  const scoreKey = getCandidateScoreKey(candidate);
  const cached = goalScorersCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.scoreKey === scoreKey && now - cached.fetchedAt < GOAL_SCORERS_CACHE_TTL_MS) {
    return cached.goals;
  }

  const liveMatchUrl = buildLiveMatchUrl(candidate);
  if (!liveMatchUrl) {
    return cached?.scoreKey === scoreKey ? cached.goals : [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(liveMatchUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`FIFA live respondió con estado ${response.status}`);
    }

    const liveMatch = (await response.json()) as FifaLiveMatchResponse;
    const playerNames = buildPlayerNamesById(liveMatch);
    const goals = [
      ...extractGoalsForSide("home", liveMatch.HomeTeam, playerNames),
      ...extractGoalsForSide("away", liveMatch.AwayTeam, playerNames),
    ]
      .sort(sortGoals)
      .map(({ period: _period, ...goal }) => goal);

    goalScorersCache.set(cacheKey, {
      fetchedAt: now,
      scoreKey,
      goals,
    });

    return goals;
  } catch {
    return cached?.scoreKey === scoreKey ? cached.goals : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));

  return results;
}

export async function fetchFifaGroupStageResults(): Promise<FifaSyncSummary> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(FIFA_MATCHES_URL, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`FIFA respondió con estado ${response.status}`);
    }

    const payload = (await response.json()) as FifaMatchesResponse;
    const allMatches = Array.isArray(payload.Results) ? payload.Results : [];
    const groupStageMatches = allMatches.filter(isGroupStageMatch);
    const matchesByGroup = new Map<string, FifaMatch[]>();

    groupStageMatches.forEach((match) => {
      const groupLetter = getGroupLetter(match);
      if (!groupLetter) return;
      const groupMatches = matchesByGroup.get(groupLetter) ?? [];
      groupMatches.push(match);
      matchesByGroup.set(groupLetter, groupMatches);
    });

    const suspiciousGroups: string[] = [];
    const candidates: FifaSyncCandidate[] = [];

    groupedMatches.forEach((groupBlock) => {
      const localMatches = groupBlock.matches;
      const fifaMatches = sortMatchesChronologically(matchesByGroup.get(groupBlock.group) ?? []);

      if (fifaMatches.length !== localMatches.length) {
        suspiciousGroups.push(`Grupo ${groupBlock.group}: FIFA entregó ${fifaMatches.length} partidos y se esperaban ${localMatches.length}.`);
        return;
      }

      const hasInvalidDate = fifaMatches.some((match) => !match.Date || Number.isNaN(Date.parse(match.Date)));
      if (hasInvalidDate) {
        suspiciousGroups.push(`Grupo ${groupBlock.group}: FIFA entregó partidos sin fecha válida; se omitió por seguridad.`);
        return;
      }

      fifaMatches.forEach((fifaMatch, index) => {
        if (!hasNumericFinalScore(fifaMatch)) return;

        const localMatch = localMatches[index];
        if (!localMatch) return;

        candidates.push({
          id: localMatch.id,
          group: groupBlock.group,
          home_result: fifaMatch.HomeTeamScore,
          away_result: fifaMatch.AwayTeamScore,
          fifaCompetitionId: fifaMatch.IdCompetition ?? null,
          fifaSeasonId: fifaMatch.IdSeason ?? null,
          fifaStageId: fifaMatch.IdStage ?? null,
          fifaMatchId: fifaMatch.IdMatch ?? null,
          fifaDate: fifaMatch.Date ?? null,
        });
      });
    });

    return {
      imported: candidates.length,
      suspiciousGroups,
      candidates,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchFifaGroupStageGoalScorers(candidates: FifaSyncCandidate[]): Promise<FifaGoalScorersByMatch> {
  const candidatesWithGoals = candidates.filter((candidate) => candidate.home_result + candidate.away_result > 0);
  const goalEntries = await mapWithConcurrency(candidatesWithGoals, GOAL_SCORERS_CONCURRENCY, async (candidate) => [
    candidate.id,
    await fetchGoalScorersForCandidate(candidate),
  ] as const);

  return Object.fromEntries(goalEntries.filter(([, goals]) => goals.length > 0));
}
