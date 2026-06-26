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
      const cutoffAt = new Date(firstKickoffAt.getTime() - 60 * 60 * 1000);
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

export function shouldUseKnockoutAsDefaultView(groupMatches: GroupResultLike[], knockoutMatches: KnockoutMatchLike[]) {
  const states = buildKnockoutPhaseStates(groupMatches, knockoutMatches);
  const firstKickoff = new Date(states["16avos"].firstKickoffAt);
  return states["16avos"].dependencyComplete || new Date() >= firstKickoff;
}

export function getKnockoutMatchFallback(matchId: string) {
  return knockoutFixtures.find((match) => match.id === matchId) ?? null;
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
