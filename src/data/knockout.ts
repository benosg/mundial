export const knockoutPhaseOrder = ["16avos", "8vos", "4tos", "semis", "3er/4to lugar", "final"] as const;

export type KnockoutPhase = (typeof knockoutPhaseOrder)[number];

export interface KnockoutFixture {
  id: string;
  order: number;
  phase: KnockoutPhase;
  label: string;
  fifaMatchId: string;
  homeSlot: string;
  awaySlot: string;
  kickoffAt: string;
  venue: string;
  city: string;
  broadcasters: string[];
}

export const knockoutBroadcastersChile = ["DGO"];
export const knockoutChvBroadcastMatchIds = new Set(["103", "104"]);

function getKnockoutBroadcasters(matchId: string) {
  if (!knockoutChvBroadcastMatchIds.has(matchId)) return knockoutBroadcastersChile;
  return ["CHV", ...knockoutBroadcastersChile];
}

export const knockoutPhaseLabels: Record<KnockoutPhase, string> = {
  "16avos": "16avos de final",
  "8vos": "8vos de final",
  "4tos": "4tos de final",
  semis: "Semifinales",
  "3er/4to lugar": "3er y 4to lugar",
  final: "Final",
};

const knockoutFixtureBase = [
  { id: "73", order: 73, phase: "16avos", label: "16avos 1", fifaMatchId: "400021518", homeSlot: "2A", awaySlot: "2B", kickoffAt: "2026-06-28T19:00:00Z", venue: "Los Angeles Stadium", city: "Los Angeles" },
  { id: "74", order: 74, phase: "16avos", label: "16avos 2", fifaMatchId: "400021513", homeSlot: "1E", awaySlot: "3ABCDF", kickoffAt: "2026-06-29T20:30:00Z", venue: "Boston Stadium", city: "Boston" },
  { id: "75", order: 75, phase: "16avos", label: "16avos 3", fifaMatchId: "400021522", homeSlot: "1F", awaySlot: "2C", kickoffAt: "2026-06-30T01:00:00Z", venue: "Monterrey Stadium", city: "Monterrey" },
  { id: "76", order: 76, phase: "16avos", label: "16avos 4", fifaMatchId: "400021516", homeSlot: "1C", awaySlot: "2F", kickoffAt: "2026-06-29T17:00:00Z", venue: "Houston Stadium", city: "Houston" },
  { id: "77", order: 77, phase: "16avos", label: "16avos 5", fifaMatchId: "400021523", homeSlot: "1I", awaySlot: "3CDFGH", kickoffAt: "2026-06-30T21:00:00Z", venue: "New York/New Jersey Stadium", city: "New Jersey" },
  { id: "78", order: 78, phase: "16avos", label: "16avos 6", fifaMatchId: "400021514", homeSlot: "2E", awaySlot: "2I", kickoffAt: "2026-06-30T17:00:00Z", venue: "Dallas Stadium", city: "Dallas" },
  { id: "79", order: 79, phase: "16avos", label: "16avos 7", fifaMatchId: "400021520", homeSlot: "1A", awaySlot: "3CEFHI", kickoffAt: "2026-07-01T01:00:00Z", venue: "Mexico City Stadium", city: "Mexico City" },
  { id: "80", order: 80, phase: "16avos", label: "16avos 8", fifaMatchId: "400021512", homeSlot: "1L", awaySlot: "3EHIJK", kickoffAt: "2026-07-01T16:00:00Z", venue: "Atlanta Stadium", city: "Atlanta" },
  { id: "81", order: 81, phase: "16avos", label: "16avos 9", fifaMatchId: "400021524", homeSlot: "1D", awaySlot: "3BEFIJ", kickoffAt: "2026-07-02T00:00:00Z", venue: "San Francisco Bay Area Stadium", city: "San Francisco Bay Area" },
  { id: "82", order: 82, phase: "16avos", label: "16avos 10", fifaMatchId: "400021525", homeSlot: "1G", awaySlot: "3AEHIJ", kickoffAt: "2026-07-01T20:00:00Z", venue: "Seattle Stadium", city: "Seattle" },
  { id: "83", order: 83, phase: "16avos", label: "16avos 11", fifaMatchId: "400021526", homeSlot: "2K", awaySlot: "2L", kickoffAt: "2026-07-02T23:00:00Z", venue: "Toronto Stadium", city: "Toronto" },
  { id: "84", order: 84, phase: "16avos", label: "16avos 12", fifaMatchId: "400021519", homeSlot: "1H", awaySlot: "2J", kickoffAt: "2026-07-02T19:00:00Z", venue: "Los Angeles Stadium", city: "Los Angeles" },
  { id: "85", order: 85, phase: "16avos", label: "16avos 13", fifaMatchId: "400021527", homeSlot: "1B", awaySlot: "3EFGIJ", kickoffAt: "2026-07-03T03:00:00Z", venue: "BC Place Vancouver", city: "Vancouver" },
  { id: "86", order: 86, phase: "16avos", label: "16avos 14", fifaMatchId: "400021521", homeSlot: "1J", awaySlot: "2H", kickoffAt: "2026-07-03T22:00:00Z", venue: "Miami Stadium", city: "Miami" },
  { id: "87", order: 87, phase: "16avos", label: "16avos 15", fifaMatchId: "400021517", homeSlot: "1K", awaySlot: "3DEIJL", kickoffAt: "2026-07-04T01:30:00Z", venue: "Kansas City Stadium", city: "Kansas City" },
  { id: "88", order: 88, phase: "16avos", label: "16avos 16", fifaMatchId: "400021515", homeSlot: "2D", awaySlot: "2G", kickoffAt: "2026-07-03T18:00:00Z", venue: "Dallas Stadium", city: "Dallas" },
  { id: "89", order: 89, phase: "8vos", label: "8vos 1", fifaMatchId: "400021533", homeSlot: "W74", awaySlot: "W77", kickoffAt: "2026-07-04T21:00:00Z", venue: "Philadelphia Stadium", city: "Philadelphia" },
  { id: "90", order: 90, phase: "8vos", label: "8vos 2", fifaMatchId: "400021530", homeSlot: "W73", awaySlot: "W75", kickoffAt: "2026-07-04T17:00:00Z", venue: "Houston Stadium", city: "Houston" },
  { id: "91", order: 91, phase: "8vos", label: "8vos 3", fifaMatchId: "400021532", homeSlot: "W76", awaySlot: "W78", kickoffAt: "2026-07-05T20:00:00Z", venue: "New York/New Jersey Stadium", city: "New Jersey" },
  { id: "92", order: 92, phase: "8vos", label: "8vos 4", fifaMatchId: "400021531", homeSlot: "W79", awaySlot: "W80", kickoffAt: "2026-07-06T00:00:00Z", venue: "Mexico City Stadium", city: "Mexico City" },
  { id: "93", order: 93, phase: "8vos", label: "8vos 5", fifaMatchId: "400021529", homeSlot: "W83", awaySlot: "W84", kickoffAt: "2026-07-06T19:00:00Z", venue: "Dallas Stadium", city: "Dallas" },
  { id: "94", order: 94, phase: "8vos", label: "8vos 6", fifaMatchId: "400021534", homeSlot: "W81", awaySlot: "W82", kickoffAt: "2026-07-07T00:00:00Z", venue: "Seattle Stadium", city: "Seattle" },
  { id: "95", order: 95, phase: "8vos", label: "8vos 7", fifaMatchId: "400021528", homeSlot: "W86", awaySlot: "W88", kickoffAt: "2026-07-07T16:00:00Z", venue: "Atlanta Stadium", city: "Atlanta" },
  { id: "96", order: 96, phase: "8vos", label: "8vos 8", fifaMatchId: "400021535", homeSlot: "W85", awaySlot: "W87", kickoffAt: "2026-07-07T20:00:00Z", venue: "BC Place Vancouver", city: "Vancouver" },
  { id: "97", order: 97, phase: "4tos", label: "4tos 1", fifaMatchId: "400021536", homeSlot: "W89", awaySlot: "W90", kickoffAt: "2026-07-09T20:00:00Z", venue: "Boston Stadium", city: "Boston" },
  { id: "98", order: 98, phase: "4tos", label: "4tos 2", fifaMatchId: "400021538", homeSlot: "W93", awaySlot: "W94", kickoffAt: "2026-07-10T19:00:00Z", venue: "Los Angeles Stadium", city: "Los Angeles" },
  { id: "99", order: 99, phase: "4tos", label: "4tos 3", fifaMatchId: "400021539", homeSlot: "W91", awaySlot: "W92", kickoffAt: "2026-07-11T21:00:00Z", venue: "Miami Stadium", city: "Miami" },
  { id: "100", order: 100, phase: "4tos", label: "4tos 4", fifaMatchId: "400021537", homeSlot: "W95", awaySlot: "W96", kickoffAt: "2026-07-12T01:00:00Z", venue: "Kansas City Stadium", city: "Kansas City" },
  { id: "101", order: 101, phase: "semis", label: "Semi 1", fifaMatchId: "400021541", homeSlot: "W97", awaySlot: "W98", kickoffAt: "2026-07-14T19:00:00Z", venue: "Dallas Stadium", city: "Dallas" },
  { id: "102", order: 102, phase: "semis", label: "Semi 2", fifaMatchId: "400021540", homeSlot: "W99", awaySlot: "W100", kickoffAt: "2026-07-15T19:00:00Z", venue: "Atlanta Stadium", city: "Atlanta" },
  { id: "103", order: 103, phase: "3er/4to lugar", label: "3er y 4to lugar", fifaMatchId: "400021542", homeSlot: "RU101", awaySlot: "RU102", kickoffAt: "2026-07-18T21:00:00Z", venue: "Miami Stadium", city: "Miami" },
  { id: "104", order: 104, phase: "final", label: "Final", fifaMatchId: "400021543", homeSlot: "W101", awaySlot: "W102", kickoffAt: "2026-07-19T19:00:00Z", venue: "New York/New Jersey Stadium", city: "New Jersey" },
] satisfies Array<Omit<KnockoutFixture, "broadcasters">>;

export const knockoutFixtures: KnockoutFixture[] = knockoutFixtureBase.map((match) => ({
  ...match,
  broadcasters: getKnockoutBroadcasters(match.id),
}));

export const knockoutFixturesByPhase = knockoutPhaseOrder.map((phase) => ({
  phase,
  label: knockoutPhaseLabels[phase],
  matches: knockoutFixtures.filter((match) => match.phase === phase),
}));

export const knockoutBracketColumns = {
  left: [
    { phase: "16avos", label: "16avos 1-8", matchIds: ["74", "77", "73", "75", "83", "84", "81", "82"] },
    { phase: "8vos", label: "8vos 1-4", matchIds: ["89", "90", "93", "94"] },
    { phase: "4tos", label: "4tos 1-2", matchIds: ["97", "98"] },
    { phase: "semis", label: "Semi 1", matchIds: ["101"] },
  ],
  center: [
    { phase: "final", label: "Final", matchIds: ["104"] },
    { phase: "3er/4to lugar", label: "3er y 4to lugar", matchIds: ["103"] },
  ],
  right: [
    { phase: "semis", label: "Semi 2", matchIds: ["102"] },
    { phase: "4tos", label: "4tos 3-4", matchIds: ["99", "100"] },
    { phase: "8vos", label: "8vos 5-8", matchIds: ["91", "92", "95", "96"] },
    { phase: "16avos", label: "16avos 9-16", matchIds: ["76", "78", "79", "80", "86", "88", "85", "87"] },
  ],
} as const;
