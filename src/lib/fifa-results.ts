import { groupedMatches } from "../data/site";

const FIFA_MATCHES_URL = "https://api.fifa.com/api/v3/calendar/matches?language=en&count=500&idSeason=285023";
const GROUP_STAGE_NAME = "First Stage";

type FifaLocalizedField = Array<{
  Description?: string;
}>;

type FifaMatch = {
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

export type FifaSyncCandidate = {
  id: string;
  group: string;
  home_result: number;
  away_result: number;
  fifaMatchId: string | null;
  fifaDate: string | null;
};

export type FifaSyncSummary = {
  imported: number;
  suspiciousGroups: string[];
  candidates: FifaSyncCandidate[];
};

function getLocalizedDescription(field?: FifaLocalizedField): string {
  return field?.find((item) => item?.Description)?.Description?.trim() ?? "";
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
