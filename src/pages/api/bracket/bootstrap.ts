import type { APIRoute } from "astro";
import { knockoutFixtures } from "../../../data/knockout";
import { fetchFifaKnockoutMatchUpdates } from "../../../lib/fifa-results";
import { getFlag } from "../../../lib/flags";
import { buildStandingsByGroup } from "../../../lib/group-standings";
import { buildKnockoutPhaseStates, resolveProbableRoundOf32Slot, shouldUseKnockoutAsDefaultView } from "../../../lib/knockout";
import { getResultsSyncIntervalMs, syncFifaResults } from "../../../lib/results-sync";
import { createServerClient } from "../../../lib/supabase";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request, url }) => {
  const browserKey = url.searchParams.get("player_id");
  const supabase = createServerClient(request, new Headers());
  const { data: { session } } = await supabase.auth.getSession();

  let player = null;

  if (session) {
    const { data: authPlayer, error: authErr } = await supabase
      .from("players")
      .select("id, name, favorite_team, favorite_flag")
      .eq("auth_user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (authErr) return json({ ok: false, error: authErr.message }, 502);
    if (authPlayer) {
      player = authPlayer;
    } else {
      const { data: created, error: createErr } = await supabase
        .from("players")
        .insert({
          auth_user_id: session.user.id,
          browser_key: "",
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
          email: session.user.email || "",
          favorite_team: "",
          favorite_flag: "",
        })
        .select("id, name, favorite_team, favorite_flag")
        .single();

      if (createErr) return json({ ok: false, error: createErr.message }, 502);
      player = created;
    }
  } else if (browserKey) {
    const { data: browserPlayer, error: playerErr } = await supabase
      .from("players")
      .select("id, name, favorite_team, favorite_flag")
      .eq("browser_key", browserKey)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (playerErr) return json({ ok: false, error: playerErr.message }, 502);
    player = browserPlayer;
  }

  await syncFifaResults({ request }).catch(() => null);

  const [groupMatchesResult, knockoutMatchesResult, predictionsResult, fifaKnockoutUpdates] = await Promise.all([
    supabase.from("matches").select("id, group, home, home_flag, away, away_flag, home_result, away_result"),
    supabase
      .from("knockout_matches")
      .select("id, phase, label, home_slot, away_slot, home_team, away_team, kickoff_at, venue, city, home_result, away_result, penalties_winner")
      .order("match_order"),
    player
      ? supabase
          .from("bracket_predictions")
          .select("match_id, home_score, away_score, penalties_winner")
          .eq("player_id", player.id)
      : Promise.resolve({ data: [] as Array<{ match_id: string; home_score: number; away_score: number; penalties_winner: "home" | "away" | null }> }),
    fetchFifaKnockoutMatchUpdates().catch(() => []),
  ]);

  if (groupMatchesResult.error) return json({ ok: false, error: groupMatchesResult.error.message }, 502);
  if (knockoutMatchesResult.error) return json({ ok: false, error: knockoutMatchesResult.error.message }, 502);

  const fifaUpdatesById = new Map(fifaKnockoutUpdates.map((match) => [match.id, match]));
  const standingsByGroup = buildStandingsByGroup(groupMatchesResult.data ?? []);

  function getOfficialTeamName(slot: string, ...candidates: Array<string | null | undefined>) {
    for (const candidate of candidates) {
      const trimmed = candidate?.trim();
      if (trimmed && trimmed !== slot) return trimmed;
    }

    return "";
  }

  const knockoutMatches = knockoutFixtures.map((fixture) => {
    const dbMatch = (knockoutMatchesResult.data ?? []).find((match) => match.id === fixture.id);
    const fifaMatch = fifaUpdatesById.get(fixture.id);
    const homeSlot = dbMatch?.home_slot || fixture.homeSlot;
    const awaySlot = dbMatch?.away_slot || fixture.awaySlot;
    const homeOfficialTeam = getOfficialTeamName(homeSlot, dbMatch?.home_team, fifaMatch?.home_team);
    const awayOfficialTeam = getOfficialTeamName(awaySlot, dbMatch?.away_team, fifaMatch?.away_team);
    const homeProbableTeam = fixture.phase === "16avos" && !homeOfficialTeam
      ? resolveProbableRoundOf32Slot(homeSlot, standingsByGroup)
      : null;
    const awayProbableTeam = fixture.phase === "16avos" && !awayOfficialTeam
      ? resolveProbableRoundOf32Slot(awaySlot, standingsByGroup)
      : null;
    const homeTeam = homeOfficialTeam || homeProbableTeam?.team || homeSlot;
    const awayTeam = awayOfficialTeam || awayProbableTeam?.team || awaySlot;

    return {
      id: fixture.id,
      phase: fixture.phase,
      label: dbMatch?.label || fixture.label,
      home_slot: homeSlot,
      away_slot: awaySlot,
      home_team: homeTeam,
      away_team: awayTeam,
      home_flag: homeProbableTeam?.flag || getFlag(homeTeam),
      away_flag: awayProbableTeam?.flag || getFlag(awayTeam),
      home_provisional: !homeOfficialTeam && !!homeProbableTeam,
      away_provisional: !awayOfficialTeam && !!awayProbableTeam,
      kickoff_at: dbMatch?.kickoff_at || fixture.kickoffAt,
      venue: dbMatch?.venue || fixture.venue,
      city: dbMatch?.city || fixture.city,
      broadcasters: fixture.broadcasters,
      home_result: dbMatch?.home_result ?? fifaMatch?.home_result ?? null,
      away_result: dbMatch?.away_result ?? fifaMatch?.away_result ?? null,
      penalties_winner: dbMatch?.penalties_winner ?? fifaMatch?.penalties_winner ?? null,
    };
  });

  const phaseStates = buildKnockoutPhaseStates(
    groupMatchesResult.data ?? [],
    knockoutMatches.map((match) => ({
      phase: match.phase,
      kickoff_at: match.kickoff_at,
      home_result: match.home_result,
      away_result: match.away_result,
      penalties_winner: match.penalties_winner,
    }))
  );

  return json({
    ok: true,
    player,
    matches: knockoutMatches,
    predictions: predictionsResult.data ?? [],
    phaseStates,
    refreshEveryMs: getResultsSyncIntervalMs(),
    defaultView: shouldUseKnockoutAsDefaultView(groupMatchesResult.data ?? [], knockoutMatches.map((match) => ({
      phase: match.phase,
      kickoff_at: match.kickoff_at,
      home_result: match.home_result,
      away_result: match.away_result,
      penalties_winner: match.penalties_winner,
    }))),
  });
};
