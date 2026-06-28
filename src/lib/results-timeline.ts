import { groupedMatches, isChvBroadcastMatch } from "../data/site";
import { knockoutPhaseLabels } from "../data/knockout";
import { getFlag } from "./flags";
import type {
  FifaGoalScorer,
  FifaGoalScorersByMatch,
  FifaMatchStatusesByMatch,
  FifaRedCard,
  FifaRedCardsByMatch,
} from "./fifa-results";
import { isKnockoutMatchComplete, resolveKnockoutMatches, type ResolvedKnockoutMatch } from "./knockout";

const TOURNAMENT_YEAR = 2026;
const CHILE_TIME_ZONE = "Etc/GMT+4";

const MONTHS: Record<string, number> = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
};

type StoredResult = {
  home_result: number | null;
  away_result: number | null;
};

const LIVE_MATCH_WINDOW_MS = 3 * 60 * 60 * 1000;

export type ResultsTimelineMatch = {
  id: string;
  stageLabel: string;
  dayKey: string;
  home: string;
  homeFlag: string;
  away: string;
  awayFlag: string;
  kickoffChile: string;
  kickoffTime: string;
  venue: string;
  city: string;
  broadcasters: string[];
  homeResult: number | null;
  awayResult: number | null;
  goalScorers: FifaGoalScorer[];
  redCards: FifaRedCard[];
  statusLabel: string;
  isFinal: boolean;
};

export type ResultsTimelineSection = {
  id: string;
  dayKey: string;
  label: string;
  matches: ResultsTimelineMatch[];
};

export type ResultsTimelineData = {
  sections: ResultsTimelineSection[];
  focusSectionId: string | null;
  completedMatches: number;
  totalMatches: number;
};

function parseKickoffChile(value: string) {
  const match = value.match(/^(\d{1,2})\s+([a-záéíóúñ]{3})\s+·\s+(\d{1,2}):(\d{2})$/i);

  if (!match) {
    return {
      dayKey: `${TOURNAMENT_YEAR}-01-01`,
      kickoffTime: value,
      sortValue: Number.MAX_SAFE_INTEGER,
      kickoffUtcMs: Number.NaN,
    };
  }

  const [, dayText, monthText, hourText, minuteText] = match;
  const day = Number(dayText);
  const month = MONTHS[monthText.toLowerCase()] ?? 0;
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const dayKey = `${TOURNAMENT_YEAR}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    dayKey,
    kickoffTime: `${hourText.padStart(2, "0")}:${minuteText}`,
    sortValue: Date.UTC(TOURNAMENT_YEAR, month, day, hour, minute),
    kickoffUtcMs: Date.UTC(TOURNAMENT_YEAR, month, day, hour + 4, minute),
  };
}

function getChileDatePartsFromUtc(value: string) {
  const date = new Date(value);
  const labelFormatter = new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TIME_ZONE,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dayKeyFormatter = new Intl.DateTimeFormat("en", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(labelFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  const dayKeyParts = Object.fromEntries(dayKeyFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  const month = (parts.month || "").replace(".", "").toLowerCase();

  return {
    dayKey: `${dayKeyParts.year}-${dayKeyParts.month}-${dayKeyParts.day}`,
    kickoffChile: `${Number(parts.day)} ${month} · ${parts.hour}:${parts.minute}`,
    kickoffTime: `${parts.hour}:${parts.minute}`,
    kickoffUtcMs: date.getTime(),
  };
}

function isLikelyLiveMatch(referenceDate: Date, kickoffUtcMs: number, hasScore: boolean) {
  if (!hasScore || !Number.isFinite(kickoffUtcMs)) return false;

  const nowMs = referenceDate.getTime();
  return nowMs >= kickoffUtcMs && nowMs <= kickoffUtcMs + LIVE_MATCH_WINDOW_MS;
}

function isFinishedByFifaStatus(status?: { matchStatus: number | null; period: number | null }) {
  if (!status) return false;
  return status.matchStatus === 0 || status.period === 10;
}

function getChileDayKey(referenceDate: Date) {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: CHILE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(formatter.formatToParts(referenceDate).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatAbsoluteDayLabel(dayKey: string) {
  const date = new Date(`${dayKey}T12:00:00Z`);
  const formatted = new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getMatchBroadcasters(matchId: string, broadcasters: string[]) {
  if (!isChvBroadcastMatch(matchId)) return broadcasters;
  return ["CHV", ...broadcasters.filter((item) => item !== "CHV")];
}

function describeDay(dayKey: string, todayKey: string) {
  const dayMs = Date.parse(`${dayKey}T00:00:00Z`);
  const todayMs = Date.parse(`${todayKey}T00:00:00Z`);
  const deltaDays = Math.round((dayMs - todayMs) / 86_400_000);

  if (deltaDays === 0) return "Hoy";
  if (deltaDays === 1) return "Mañana";
  if (deltaDays === -1) return "Ayer";
  return formatAbsoluteDayLabel(dayKey);
}

function resolveFocusSectionId(dayKeys: string[], todayKey: string) {
  if (dayKeys.length === 0) return null;

  const todayOrNext = dayKeys.find((dayKey) => dayKey >= todayKey);
  const chosen = todayOrNext ?? dayKeys[dayKeys.length - 1];
  return `results-day-${chosen}`;
}

export function buildResultsTimeline(
  storedResults: Record<string, StoredResult> = {},
  referenceDate = new Date(),
  goalScorersByMatch: FifaGoalScorersByMatch = {},
  redCardsByMatch: FifaRedCardsByMatch = {},
  fifaStatusesByMatch: FifaMatchStatusesByMatch = {},
  knockoutMatches: ResolvedKnockoutMatch[] = resolveKnockoutMatches(),
): ResultsTimelineData {
  const todayKey = getChileDayKey(referenceDate);
  const dayMap = new Map<string, ResultsTimelineMatch[]>();

  const flattenedMatches = groupedMatches.flatMap((groupBlock) =>
    groupBlock.matches.map((match) => {
      const parsedKickoff = parseKickoffChile(match.kickoffChile);
      const result = storedResults[match.id];
      const hasScore = Number.isInteger(result?.home_result) && Number.isInteger(result?.away_result);
      const fifaStatus = fifaStatusesByMatch[match.id];
      const isHeuristicLive = isLikelyLiveMatch(referenceDate, parsedKickoff.kickoffUtcMs, hasScore);
      const isFinal = hasScore && (fifaStatus ? isFinishedByFifaStatus(fifaStatus) : !isHeuristicLive);
      const isLive = fifaStatus ? hasScore && !isFinishedByFifaStatus(fifaStatus) : isHeuristicLive;
      const statusLabel = isFinal
        ? "Final"
        : isLive
          ? "En juego"
          : parsedKickoff.dayKey < todayKey
            ? "Esperando oficial"
            : parsedKickoff.dayKey === todayKey
              ? "Hoy"
              : "Programado";

      return {
        id: match.id,
        stageLabel: `Grupo ${groupBlock.group}`,
        dayKey: parsedKickoff.dayKey,
        sortValue: parsedKickoff.sortValue,
        home: match.home,
        homeFlag: match.homeFlag,
        away: match.away,
        awayFlag: match.awayFlag,
        kickoffChile: match.kickoffChile,
        kickoffTime: parsedKickoff.kickoffTime,
        venue: match.venue,
        city: match.city,
        broadcasters: getMatchBroadcasters(match.id, match.broadcasters),
        homeResult: hasScore ? result?.home_result ?? null : null,
        awayResult: hasScore ? result?.away_result ?? null : null,
        goalScorers: hasScore ? goalScorersByMatch[match.id] ?? [] : [],
        redCards: hasScore ? redCardsByMatch[match.id] ?? [] : [],
        statusLabel,
        isFinal,
      };
    }),
  );

  const flattenedKnockoutMatches = knockoutMatches.map((match) => {
    const parsedKickoff = getChileDatePartsFromUtc(match.kickoff_at);
    const hasScore = Number.isInteger(match.home_result) && Number.isInteger(match.away_result);
    const isFinal = hasScore && isKnockoutMatchComplete(match);
    const isLive = hasScore && !isFinal && isLikelyLiveMatch(referenceDate, parsedKickoff.kickoffUtcMs, hasScore);
    const statusLabel = isFinal
      ? "Final"
      : isLive
        ? "En juego"
        : parsedKickoff.dayKey < todayKey
          ? "Esperando oficial"
          : parsedKickoff.dayKey === todayKey
            ? "Hoy"
            : "Programado";

    return {
      id: match.id,
      stageLabel: match.label || knockoutPhaseLabels[match.phase],
      dayKey: parsedKickoff.dayKey,
      sortValue: parsedKickoff.kickoffUtcMs,
      home: match.home_team,
      homeFlag: getFlag(match.home_team),
      away: match.away_team,
      awayFlag: getFlag(match.away_team),
      kickoffChile: parsedKickoff.kickoffChile,
      kickoffTime: parsedKickoff.kickoffTime,
      venue: match.venue,
      city: match.city,
      broadcasters: match.broadcasters,
      homeResult: hasScore ? match.home_result : null,
      awayResult: hasScore ? match.away_result : null,
      goalScorers: [],
      redCards: [],
      statusLabel,
      isFinal,
    };
  });

  const allMatches = [...flattenedMatches, ...flattenedKnockoutMatches]
    .sort((left, right) => left.sortValue - right.sortValue || left.id.localeCompare(right.id));

  allMatches.forEach(({ sortValue: _sortValue, ...match }) => {
    const dayMatches = dayMap.get(match.dayKey) ?? [];
    dayMatches.push(match);
    dayMap.set(match.dayKey, dayMatches);
  });

  const dayKeys = [...dayMap.keys()].sort();
  const sections = dayKeys.map((dayKey) => ({
    id: `results-day-${dayKey}`,
    dayKey,
    label: `Mundial 2026 · ${describeDay(dayKey, todayKey)}`,
    matches: dayMap.get(dayKey) ?? [],
  }));

  return {
    sections,
    focusSectionId: resolveFocusSectionId(dayKeys, todayKey),
    completedMatches: allMatches.filter((match) => match.isFinal).length,
    totalMatches: allMatches.length,
  };
}
