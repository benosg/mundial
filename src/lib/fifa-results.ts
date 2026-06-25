import { groupedMatches } from "../data/site";
import { knockoutFixtures } from "../data/knockout";

const FIFA_MATCHES_URL = "https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023";
const FIFA_LIVE_MATCH_URL = "https://api.fifa.com/api/v3/live/football";
const GROUP_STAGE_NAME = "First Stage";
const LIVE_EVENTS_CACHE_TTL_MS = 10 * 60_000;
const LIVE_EVENTS_CONCURRENCY = 6;

type FifaLocalizedField = Array<{
  Description?: string;
}>;

type FifaTeam = {
  Score?: number | null;
  TeamName?: FifaLocalizedField;
  ShortClubName?: string;
};

type FifaMatch = {
  IdCompetition?: string;
  IdSeason?: string;
  IdStage?: string;
  IdMatch?: string;
  MatchNumber?: number;
  Date?: string;
  GroupName?: FifaLocalizedField;
  StageName?: FifaLocalizedField;
  Home?: FifaTeam | null;
  Away?: FifaTeam | null;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
  HomeTeamPenaltyScore?: number | null;
  AwayTeamPenaltyScore?: number | null;
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

type FifaLiveBooking = {
  Card?: number | null;
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
  Bookings?: FifaLiveBooking[];
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

export type FifaRedCard = {
  side: GoalSide;
  minute: string;
  name: string;
};

export type FifaRedCardsByMatch = Record<string, FifaRedCard[]>;

export type FifaMatchEventsByMatch = {
  goalScorers: FifaGoalScorersByMatch;
  redCards: FifaRedCardsByMatch;
};

export type FifaSyncSummary = {
  imported: number;
  suspiciousGroups: string[];
  candidates: FifaSyncCandidate[];
};

export type FifaKnockoutMatchUpdate = {
  id: string;
  home_team: string | null;
  away_team: string | null;
  home_result: number | null;
  away_result: number | null;
  penalties_winner: "home" | "away" | null;
};

type LiveEventsCacheEntry = {
  fetchedAt: number;
  scoreKey: string;
  goals: FifaGoalScorer[];
  redCards: FifaRedCard[];
};

const liveEventsCache = new Map<string, LiveEventsCacheEntry>();

const fifaTeamNameToDisplayName: Record<string, string> = {
  "South Africa": "Sudáfrica",
  "Korea Republic": "Corea del Sur",
  Czechia: "Chequia",
  Canada: "Canadá",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Switzerland: "Suiza",
  Brazil: "Brasil",
  Morocco: "Marruecos",
  Haiti: "Haití",
  Scotland: "Escocia",
  Türkiye: "Turquía",
  Germany: "Alemania",
  Curaçao: "Curazao",
  "Côte d'Ivoire": "Costa de Marfil",
  "Cote d'Ivoire": "Costa de Marfil",
  Netherlands: "Países Bajos",
  Japan: "Japón",
  Sweden: "Suecia",
  Tunisia: "Túnez",
  Belgium: "Bélgica",
  Egypt: "Egipto",
  "IR Iran": "Irán",
  "New Zealand": "Nueva Zelanda",
  Spain: "España",
  "Cabo Verde": "Cabo Verde",
  "Saudi Arabia": "Arabia Saudita",
  France: "Francia",
  Senegal: "Senegal",
  Iraq: "Irak",
  Norway: "Noruega",
  Argentina: "Argentina",
  Algeria: "Argelia",
  Austria: "Austria",
  Jordan: "Jordania",
  Portugal: "Portugal",
  "Congo DR": "Congo DR",
  Uzbekistan: "Uzbekistán",
  Colombia: "Colombia",
  England: "Inglaterra",
  Croatia: "Croacia",
  Ghana: "Ghana",
  Panama: "Panamá",
  Mexico: "México",
  USA: "USA",
  Paraguay: "Paraguay",
  Australia: "Australia",
  Ecuador: "Ecuador",
  Uruguay: "Uruguay",
  Qatar: "Qatar",
};

let knockoutUpdatesCache: { fetchedAt: number; updates: FifaKnockoutMatchUpdate[] } | null = null;
const KNOCKOUT_UPDATES_CACHE_TTL_MS = 60_000;

function getLocalizedDescription(field?: FifaLocalizedField): string {
  return field?.find((item) => item?.Description)?.Description?.trim() ?? "";
}

function getDisplayTeamName(team?: FifaTeam | null) {
  const rawName = getLocalizedDescription(team?.TeamName) || team?.ShortClubName?.trim() || "";
  if (!rawName) return null;

  return fifaTeamNameToDisplayName[rawName] ?? rawName;
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

function getPenaltyWinner(match: FifaMatch) {
  if (!Number.isInteger(match.HomeTeamPenaltyScore) || !Number.isInteger(match.AwayTeamPenaltyScore)) {
    return null;
  }

  const homePenaltyScore = Number(match.HomeTeamPenaltyScore);
  const awayPenaltyScore = Number(match.AwayTeamPenaltyScore);

  if (homePenaltyScore > awayPenaltyScore) return "home" as const;
  if (awayPenaltyScore > homePenaltyScore) return "away" as const;
  return null;
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

function sortTimedEvents(left: { minute: string; name: string; period: number }, right: { minute: string; name: string; period: number }) {
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

function extractRedCardsForSide(
  side: GoalSide,
  team: FifaLiveTeam | undefined,
  playerNames: Map<string, string>,
): Array<FifaRedCard & { period: number }> {
  return (team?.Bookings ?? [])
    .filter((booking) => booking.Card === 2)
    .map((booking) => {
      const playerName = booking.IdPlayer ? playerNames.get(booking.IdPlayer) : null;
      const minute = booking.Minute?.trim();

      if (!minute) return null;

      return {
        side,
        minute,
        name: playerName || "Expulsado",
        period: Number.isInteger(booking.Period) ? Number(booking.Period) : Number.MAX_SAFE_INTEGER,
      };
    })
    .filter((card): card is FifaRedCard & { period: number } => card !== null);
}

async function fetchLiveEventsForCandidate(candidate: FifaSyncCandidate): Promise<{ goals: FifaGoalScorer[]; redCards: FifaRedCard[] }> {
  const cacheKey = candidate.id;
  const scoreKey = getCandidateScoreKey(candidate);
  const cached = liveEventsCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.scoreKey === scoreKey && now - cached.fetchedAt < LIVE_EVENTS_CACHE_TTL_MS) {
    return { goals: cached.goals, redCards: cached.redCards };
  }

  const liveMatchUrl = buildLiveMatchUrl(candidate);
  if (!liveMatchUrl) {
    return cached?.scoreKey === scoreKey ? { goals: cached.goals, redCards: cached.redCards } : { goals: [], redCards: [] };
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
      .sort(sortTimedEvents)
      .map(({ period: _period, ...goal }) => goal);
    const redCards = [
      ...extractRedCardsForSide("home", liveMatch.HomeTeam, playerNames),
      ...extractRedCardsForSide("away", liveMatch.AwayTeam, playerNames),
    ]
      .sort(sortTimedEvents)
      .map(({ period: _period, ...card }) => card);

    liveEventsCache.set(cacheKey, {
      fetchedAt: now,
      scoreKey,
      goals,
      redCards,
    });

    return { goals, redCards };
  } catch {
    return cached?.scoreKey === scoreKey ? { goals: cached.goals, redCards: cached.redCards } : { goals: [], redCards: [] };
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

async function fetchFifaCalendarMatches() {
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
    return Array.isArray(payload.Results) ? payload.Results : [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchFifaGroupStageResults(): Promise<FifaSyncSummary> {
  const allMatches = await fetchFifaCalendarMatches();
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
}

export async function fetchFifaKnockoutMatchUpdates(): Promise<FifaKnockoutMatchUpdate[]> {
  const now = Date.now();
  if (knockoutUpdatesCache && now - knockoutUpdatesCache.fetchedAt < KNOCKOUT_UPDATES_CACHE_TTL_MS) {
    return knockoutUpdatesCache.updates;
  }

  const allMatches = await fetchFifaCalendarMatches();
  const matchesByFifaId = new Map(
    allMatches
      .filter((match) => match.IdMatch)
      .map((match) => [String(match.IdMatch), match] as const)
  );

  const updates = knockoutFixtures.map((fixture) => {
    const fifaMatch = matchesByFifaId.get(fixture.fifaMatchId);

    return {
      id: fixture.id,
      home_team: getDisplayTeamName(fifaMatch?.Home),
      away_team: getDisplayTeamName(fifaMatch?.Away),
      home_result: Number.isInteger(fifaMatch?.HomeTeamScore) ? Number(fifaMatch?.HomeTeamScore) : null,
      away_result: Number.isInteger(fifaMatch?.AwayTeamScore) ? Number(fifaMatch?.AwayTeamScore) : null,
      penalties_winner: fifaMatch ? getPenaltyWinner(fifaMatch) : null,
    } satisfies FifaKnockoutMatchUpdate;
  });

  knockoutUpdatesCache = { fetchedAt: now, updates };
  return updates;
}

export async function fetchFifaGroupStageMatchEvents(candidates: FifaSyncCandidate[]): Promise<FifaMatchEventsByMatch> {
  const eventEntries = await mapWithConcurrency(candidates, LIVE_EVENTS_CONCURRENCY, async (candidate) => [
    candidate.id,
    await fetchLiveEventsForCandidate(candidate),
  ] as const);

  return {
    goalScorers: Object.fromEntries(
      eventEntries
        .map(([matchId, events]) => [matchId, events.goals] as const)
        .filter(([, goals]) => goals.length > 0),
    ),
    redCards: Object.fromEntries(
      eventEntries
        .map(([matchId, events]) => [matchId, events.redCards] as const)
        .filter(([, redCards]) => redCards.length > 0),
    ),
  };
}
