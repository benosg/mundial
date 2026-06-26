import { getFlag } from "./flags";

export interface GroupMatchStandingLike {
  group: string;
  home: string;
  home_flag?: string | null;
  away: string;
  away_flag?: string | null;
  home_result: number | null;
  away_result: number | null;
}

export interface GroupStandingRow {
  group: string;
  team: string;
  flag: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  played: number;
}

export type GroupStandingsByGroup = Record<string, GroupStandingRow[]>;

function hasScore(value: number | null | undefined): value is number {
  return Number.isInteger(value);
}

function compareTeamNames(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

export function compareStandingsRows(a: Pick<GroupStandingRow, "team" | "points" | "goalDifference" | "goalsFor">, b: Pick<GroupStandingRow, "team" | "points" | "goalDifference" | "goalsFor">) {
  return (
    b.points - a.points
    || b.goalDifference - a.goalDifference
    || b.goalsFor - a.goalsFor
    || compareTeamNames(a.team, b.team)
  );
}

export function buildGroupStandings(matches: GroupMatchStandingLike[]): GroupStandingRow[] {
  const table = new Map<string, GroupStandingRow>();

  for (const match of matches) {
    if (!table.has(match.home)) {
      table.set(match.home, {
        group: match.group,
        team: match.home,
        flag: match.home_flag || getFlag(match.home),
        points: 0,
        goalDifference: 0,
        goalsFor: 0,
        played: 0,
      });
    }

    if (!table.has(match.away)) {
      table.set(match.away, {
        group: match.group,
        team: match.away,
        flag: match.away_flag || getFlag(match.away),
        points: 0,
        goalDifference: 0,
        goalsFor: 0,
        played: 0,
      });
    }

    const homeScore = match.home_result;
    const awayScore = match.away_result;

    if (!hasScore(homeScore) || !hasScore(awayScore)) {
      continue;
    }

    const homeRow = table.get(match.home)!;
    const awayRow = table.get(match.away)!;

    homeRow.played += 1;
    awayRow.played += 1;
    homeRow.goalsFor += homeScore;
    awayRow.goalsFor += awayScore;
    homeRow.goalDifference += homeScore - awayScore;
    awayRow.goalDifference += awayScore - homeScore;

    if (homeScore > awayScore) {
      homeRow.points += 3;
    } else if (homeScore < awayScore) {
      awayRow.points += 3;
    } else {
      homeRow.points += 1;
      awayRow.points += 1;
    }
  }

  return Array.from(table.values()).sort(compareStandingsRows);
}

export function buildStandingsByGroup(matches: GroupMatchStandingLike[]): GroupStandingsByGroup {
  const matchesByGroup = new Map<string, GroupMatchStandingLike[]>();

  for (const match of matches) {
    const groupMatches = matchesByGroup.get(match.group) ?? [];
    groupMatches.push(match);
    matchesByGroup.set(match.group, groupMatches);
  }

  return Object.fromEntries(
    Array.from(matchesByGroup.entries())
      .sort(([a], [b]) => compareTeamNames(a, b))
      .map(([group, groupMatches]) => [group, buildGroupStandings(groupMatches)])
  );
}

export function getBestThirdPlaceRows(standingsByGroup: GroupStandingsByGroup) {
  return Object.values(standingsByGroup)
    .map((standings) => standings[2] ?? null)
    .filter((row): row is GroupStandingRow => Boolean(row))
    .sort(compareStandingsRows)
    .slice(0, 8);
}
