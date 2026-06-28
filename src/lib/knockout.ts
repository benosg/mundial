import {
  roundOf32BestThirdPlaceMatrix,
  roundOf32BestThirdPlaceOrder,
  roundOf32BestThirdPlaceSlotOwners,
} from "../data/round-of-32-best-third-place";
import { knockoutFixtures, knockoutPhaseLabels, knockoutPhaseOrder, type KnockoutPhase } from "../data/knockout";
import { buildStandingsByGroup, getBestThirdPlaceRows, type GroupMatchStandingLike, type GroupStandingRow, type GroupStandingsByGroup } from "./group-standings";

export type WinnerSide = "home" | "away";

export interface GroupResultLike {
  home_result: number | null;
  away_result: number | null;
}

export interface KnockoutMatchLike {
  id?: string;
  phase: KnockoutPhase;
  kickoff_at: string;
  home_result: number | null;
  away_result: number | null;
  penalties_winner?: WinnerSide | null;
}

export interface KnockoutPredictionLike {
  home_score: number;
  away_score: number;
  penalties_winner?: WinnerSide | null;
}

export interface KnockoutMatchSourceLike {
  id: string;
  phase?: KnockoutPhase | null;
  label?: string | null;
  home_slot?: string | null;
  away_slot?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  kickoff_at?: string | null;
  venue?: string | null;
  city?: string | null;
  broadcasters?: string[] | null;
  home_result?: number | null;
  away_result?: number | null;
  penalties_winner?: WinnerSide | null;
}

export interface ResolvedKnockoutMatch {
  id: string;
  phase: KnockoutPhase;
  label: string;
  home_slot: string;
  away_slot: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  venue: string;
  city: string;
  broadcasters: string[];
  home_result: number | null;
  away_result: number | null;
  penalties_winner: WinnerSide | null;
}

export interface KnockoutPointsResult {
  points: number;
  type: "exact" | "winner" | "none";
}

export interface PhaseState {
  phase: KnockoutPhase;
  label: string;
  editable: boolean;
  status: "pending" | "open" | "locked" | "completed";
  dependencyComplete: boolean;
  dependencyLabel: string;
  firstKickoffAt: string;
  cutoffAt: string;
}

const previousDependency: Record<KnockoutPhase, KnockoutPhase | "groups" | "semis"> = {
  "16avos": "groups",
  "8vos": "16avos",
  "4tos": "8vos",
  semis: "4tos",
  "3er/4to lugar": "semis",
  final: "semis",
};

function hasScore(value: number | null | undefined): value is number {
  return Number.isInteger(value);
}

export function isKnockoutMatchComplete(match: Pick<KnockoutMatchLike, "home_result" | "away_result" | "penalties_winner">) {
  if (!hasScore(match.home_result) || !hasScore(match.away_result)) {
    return false;
  }

  if (match.home_result === match.away_result) {
    return match.penalties_winner === "home" || match.penalties_winner === "away";
  }

  return true;
}

function getWinnerFromScores(homeScore: number, awayScore: number, penaltiesWinner?: WinnerSide | null) {
  if (homeScore > awayScore) return "home" as const;
  if (awayScore > homeScore) return "away" as const;
  return penaltiesWinner ?? null;
}

export function calculateKnockoutPoints(
  actualHome: number | null,
  actualAway: number | null,
  actualPenaltiesWinner: WinnerSide | null | undefined,
  prediction: KnockoutPredictionLike
): KnockoutPointsResult {
  if (!hasScore(actualHome) || !hasScore(actualAway)) {
    return { points: 0, type: "none" };
  }

  const actualWinner = getWinnerFromScores(actualHome, actualAway, actualPenaltiesWinner);
  const predictedWinner = getWinnerFromScores(
    prediction.home_score,
    prediction.away_score,
    prediction.penalties_winner
  );

  const exact =
    actualHome === prediction.home_score &&
    actualAway === prediction.away_score &&
    (actualHome !== actualAway || actualPenaltiesWinner === prediction.penalties_winner);

  if (exact) {
    return { points: 5, type: "exact" };
  }

  if (actualWinner && predictedWinner && actualWinner === predictedWinner) {
    return { points: 3, type: "winner" };
  }

  return { points: 0, type: "none" };
}

function areGroupsComplete(matches: GroupResultLike[]) {
  return matches.length > 0 && matches.every((match) => hasScore(match.home_result) && hasScore(match.away_result));
}

function arePhaseMatchesComplete(phase: KnockoutPhase, matches: KnockoutMatchLike[]) {
  const phaseMatches = matches.filter((match) => match.phase === phase);
  return phaseMatches.length > 0 && phaseMatches.every(isKnockoutMatchComplete);
}

function getFirstKickoffAt(phase: KnockoutPhase, matches: KnockoutMatchLike[]) {
  const sourceMatches = matches.filter((match) => match.phase === phase);
  const fallbackMatches = knockoutFixtures.filter((match) => match.phase === phase).map((match) => ({ kickoff_at: match.kickoffAt }));
  const list = (sourceMatches.length > 0 ? sourceMatches : fallbackMatches)
    .map((match) => new Date(match.kickoff_at).getTime())
    .filter((time) => !Number.isNaN(time));

  return new Date(Math.min(...list));
}

export function buildKnockoutPhaseStates(
  groupMatches: GroupResultLike[],
  knockoutMatches: KnockoutMatchLike[],
  now = new Date()
): Record<KnockoutPhase, PhaseState> {
  return Object.fromEntries(
    knockoutPhaseOrder.map((phase) => {
      const dependency = previousDependency[phase];
      const dependencyComplete =
        dependency === "groups" ? areGroupsComplete(groupMatches) : arePhaseMatchesComplete(dependency, knockoutMatches);
      const firstKickoffAt = getFirstKickoffAt(phase, knockoutMatches);
      const cutoffAt = new Date(firstKickoffAt.getTime() - 10 * 60 * 1000);
      const completed = arePhaseMatchesComplete(phase, knockoutMatches);
      const editable = dependencyComplete && now < cutoffAt;
      const status = completed ? "completed" : editable ? "open" : dependencyComplete ? "locked" : "pending";

      return [
        phase,
        {
          phase,
          label: knockoutPhaseLabels[phase],
          editable,
          status,
          dependencyComplete,
          dependencyLabel: dependency === "groups" ? "fase de grupos" : knockoutPhaseLabels[dependency],
          firstKickoffAt: firstKickoffAt.toISOString(),
          cutoffAt: cutoffAt.toISOString(),
        } satisfies PhaseState,
      ];
    })
  ) as Record<KnockoutPhase, PhaseState>;
}

export function getActiveKnockoutPhaseState(
  groupMatches: GroupResultLike[],
  knockoutMatches: KnockoutMatchLike[],
  now = new Date()
) {
  const states = buildKnockoutPhaseStates(groupMatches, knockoutMatches, now);

  for (const phase of knockoutPhaseOrder) {
    const state = states[phase];
    if (state.status !== "completed" && state.dependencyComplete) {
      return state;
    }
  }

  return knockoutPhaseOrder.every((phase) => states[phase].status === "completed")
    ? states.final
    : null;
}

export function shouldUseKnockoutAsDefaultView(groupMatches: GroupResultLike[], knockoutMatches: KnockoutMatchLike[]) {
  const now = new Date();
  const activePhase = getActiveKnockoutPhaseState(groupMatches, knockoutMatches, now);

  if (!activePhase) {
    return false;
  }

  if (activePhase.status === "completed") {
    return true;
  }

  const switchAt = new Date(new Date(activePhase.firstKickoffAt).getTime() - 60 * 60 * 1000);
  return now >= switchAt;
}

export function getKnockoutMatchFallback(matchId: string) {
  return knockoutFixtures.find((match) => match.id === matchId) ?? null;
}

function getOfficialTeamName(slot: string, ...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && trimmed !== slot) return trimmed;
  }

  return "";
}

function parseKnockoutReferenceSlot(slot: string) {
  const match = slot.match(/^(W|RU)(\d+)$/);
  if (!match) return null;

  return {
    type: match[1] === "W" ? "winner" as const : "runner-up" as const,
    matchId: match[2],
  };
}

function resolveTeamFromReferenceSlot(slot: string, resolvedMatchesById: Map<string, ResolvedKnockoutMatch>) {
  const reference = parseKnockoutReferenceSlot(slot);
  if (!reference) return null;

  const sourceMatch = resolvedMatchesById.get(reference.matchId);
  if (!sourceMatch || !isKnockoutMatchComplete(sourceMatch)) {
    return null;
  }

  if (!hasScore(sourceMatch.home_result) || !hasScore(sourceMatch.away_result)) {
    return null;
  }

  const winnerSide = getWinnerFromScores(sourceMatch.home_result, sourceMatch.away_result, sourceMatch.penalties_winner);
  if (!winnerSide) {
    return null;
  }

  const resolvedSide = reference.type === "winner"
    ? winnerSide
    : winnerSide === "home"
      ? "away"
      : "home";

  const resolvedTeam = resolvedSide === "home" ? sourceMatch.home_team : sourceMatch.away_team;
  const resolvedSlot = resolvedSide === "home" ? sourceMatch.home_slot : sourceMatch.away_slot;
  return resolvedTeam && resolvedTeam !== resolvedSlot ? resolvedTeam : null;
}

export function resolveKnockoutMatches(
  sourceMatches: KnockoutMatchSourceLike[] = [],
  fifaUpdates: Array<Pick<KnockoutMatchSourceLike, "id" | "home_team" | "away_team" | "home_result" | "away_result" | "penalties_winner">> = []
): ResolvedKnockoutMatch[] {
  const sourceMatchesById = new Map(sourceMatches.map((match) => [match.id, match]));
  const fifaUpdatesById = new Map(fifaUpdates.map((match) => [match.id, match]));
  const resolvedMatchesById = new Map<string, ResolvedKnockoutMatch>();

  return knockoutFixtures.map((fixture) => {
    const sourceMatch = sourceMatchesById.get(fixture.id);
    const fifaMatch = fifaUpdatesById.get(fixture.id);
    const homeSlot = sourceMatch?.home_slot || fixture.homeSlot;
    const awaySlot = sourceMatch?.away_slot || fixture.awaySlot;
    const homeTeam =
      getOfficialTeamName(homeSlot, sourceMatch?.home_team, fifaMatch?.home_team) ||
      resolveTeamFromReferenceSlot(homeSlot, resolvedMatchesById) ||
      homeSlot;
    const awayTeam =
      getOfficialTeamName(awaySlot, sourceMatch?.away_team, fifaMatch?.away_team) ||
      resolveTeamFromReferenceSlot(awaySlot, resolvedMatchesById) ||
      awaySlot;

    const resolvedMatch = {
      id: fixture.id,
      phase: sourceMatch?.phase || fixture.phase,
      label: sourceMatch?.label || fixture.label,
      home_slot: homeSlot,
      away_slot: awaySlot,
      home_team: homeTeam,
      away_team: awayTeam,
      kickoff_at: sourceMatch?.kickoff_at || fixture.kickoffAt,
      venue: sourceMatch?.venue || fixture.venue,
      city: sourceMatch?.city || fixture.city,
      broadcasters: sourceMatch?.broadcasters || fixture.broadcasters,
      home_result: sourceMatch?.home_result ?? fifaMatch?.home_result ?? null,
      away_result: sourceMatch?.away_result ?? fifaMatch?.away_result ?? null,
      penalties_winner: sourceMatch?.penalties_winner ?? fifaMatch?.penalties_winner ?? null,
    } satisfies ResolvedKnockoutMatch;

    resolvedMatchesById.set(fixture.id, resolvedMatch);
    return resolvedMatch;
  });
}

export interface ProbableKnockoutTeam {
  slot: string;
  team: string;
  flag: string;
  provisional: true;
}

function resolveDirectStandingSlot(slot: string, standingsByGroup: GroupStandingsByGroup) {
  const match = slot.match(/^([123])([A-L])$/);
  if (!match) return null;

  const [, position, group] = match;
  const row = standingsByGroup[group]?.[Number(position) - 1] ?? null;
  if (!row || row.played === 0) return null;
  return row;
}

function buildBestThirdAssignments(standingsByGroup: GroupStandingsByGroup) {
  const bestThirdRows = getBestThirdPlaceRows(standingsByGroup);
  if (bestThirdRows.length !== 8) {
    return new Map<string, GroupStandingRow>();
  }

  const combinationKey = bestThirdRows.map((row) => row.group).sort().join("");
  const assignments = roundOf32BestThirdPlaceMatrix[combinationKey] ?? [];

  const bestThirdRowsByGroup = new Map(bestThirdRows.map((row) => [row.group, row]));

  return new Map(
    assignments
      .map((assignment, index) => [roundOf32BestThirdPlaceOrder[index], bestThirdRowsByGroup.get(assignment.slice(1)) ?? null] as const)
      .filter((entry): entry is readonly [(typeof roundOf32BestThirdPlaceOrder)[number], GroupStandingRow] => Boolean(entry[1]))
  );
}

export function resolveProbableRoundOf32Slot(slot: string, standingsByGroup: GroupStandingsByGroup): ProbableKnockoutTeam | null {
  const directRow = resolveDirectStandingSlot(slot, standingsByGroup);
  if (directRow) {
    return {
      slot,
      team: directRow.team,
      flag: directRow.flag,
      provisional: true,
    };
  }

  if (!/^3[A-L]+$/.test(slot)) {
    return null;
  }

  const ownerGroup = roundOf32BestThirdPlaceSlotOwners[slot];
  if (!ownerGroup) {
    return null;
  }

  const mappedRow = buildBestThirdAssignments(standingsByGroup).get(ownerGroup);
  if (!mappedRow || mappedRow.played === 0) {
    return null;
  }

  return {
    slot,
    team: mappedRow.team,
    flag: mappedRow.flag,
    provisional: true,
  };
}

export function buildGroupStandingsForKnockout(matches: GroupMatchStandingLike[]) {
  return buildStandingsByGroup(matches);
}
