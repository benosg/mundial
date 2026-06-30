import type { APIRoute } from "astro";
import { fetchFifaKnockoutMatchUpdates } from "../../../lib/fifa-results";
import { getFlag } from "../../../lib/flags";
import { buildKnockoutPhaseStates, getOfficialKnockoutTeamName, resolveKnockoutMatches, shouldUseKnockoutAsDefaultView } from "../../../lib/knockout";
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

  const knockoutMatches = resolveKnockoutMatches(knockoutMatchesResult.data ?? [], fifaKnockoutUpdates).map((match) => {
    const homeOfficialTeam = getOfficialKnockoutTeamName(match.home_slot, match.home_team);
    const awayOfficialTeam = getOfficialKnockoutTeamName(match.away_slot, match.away_team);
    const homeTeam = homeOfficialTeam || match.home_slot;
    const awayTeam = awayOfficialTeam || match.away_slot;

    return {
      id: match.id,
      phase: match.phase,
      label: match.label,
      home_slot: match.home_slot,
      away_slot: match.away_slot,
      home_team: homeTeam,
      away_team: awayTeam,
      home_flag: getFlag(homeTeam),
      away_flag: getFlag(awayTeam),
      home_provisional: false,
      away_provisional: false,
      kickoff_at: match.kickoff_at,
      venue: match.venue,
      city: match.city,
      broadcasters: match.broadcasters,
      home_result: match.home_result,
      away_result: match.away_result,
      penalties_winner: match.penalties_winner,
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
