import { groupedMatches, isChvBroadcastMatch } from "../data/site";
import type { FifaGoalScorer, FifaGoalScorersByMatch, FifaRedCard, FifaRedCardsByMatch } from "./fifa-results";

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
  group: string;
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

function isLikelyLiveMatch(referenceDate: Date, kickoffUtcMs: number, hasScore: boolean) {
  if (!hasScore || !Number.isFinite(kickoffUtcMs)) return false;

  const nowMs = referenceDate.getTime();
  return nowMs >= kickoffUtcMs && nowMs <= kickoffUtcMs + LIVE_MATCH_WINDOW_MS;
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
): ResultsTimelineData {
  const todayKey = getChileDayKey(referenceDate);
  const dayMap = new Map<string, ResultsTimelineMatch[]>();

  const flattenedMatches = groupedMatches.flatMap((groupBlock) =>
    groupBlock.matches.map((match) => {
      const parsedKickoff = parseKickoffChile(match.kickoffChile);
      const result = storedResults[match.id];
      const isFinal = Number.isInteger(result?.home_result) && Number.isInteger(result?.away_result);
      const isLive = isLikelyLiveMatch(referenceDate, parsedKickoff.kickoffUtcMs, isFinal);
      const statusLabel = isFinal
         ? (isLive ? "En juego" : "Final")
         : parsedKickoff.dayKey < todayKey
           ? "Esperando oficial"
           : parsedKickoff.dayKey === todayKey
            ? "Hoy"
            : "Programado";

      return {
        id: match.id,
        group: groupBlock.group,
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
        homeResult: isFinal ? result?.home_result ?? null : null,
        awayResult: isFinal ? result?.away_result ?? null : null,
        goalScorers: isFinal ? goalScorersByMatch[match.id] ?? [] : [],
        redCards: isFinal ? redCardsByMatch[match.id] ?? [] : [],
        statusLabel,
        isFinal,
      };
    }),
  ).sort((left, right) => left.sortValue - right.sortValue || left.id.localeCompare(right.id));

  flattenedMatches.forEach(({ sortValue: _sortValue, ...match }) => {
    const dayMatches = dayMap.get(match.dayKey) ?? [];
    dayMatches.push(match);
    dayMap.set(match.dayKey, dayMatches);
  });

  const dayKeys = [...dayMap.keys()].sort();
  const sections = dayKeys.map((dayKey) => ({
    id: `results-day-${dayKey}`,
    dayKey,
    label: `Fase de grupos · ${describeDay(dayKey, todayKey)}`,
    matches: dayMap.get(dayKey) ?? [],
  }));

  return {
    sections,
    focusSectionId: resolveFocusSectionId(dayKeys, todayKey),
    completedMatches: flattenedMatches.filter((match) => match.isFinal).length,
    totalMatches: flattenedMatches.length,
  };
}
