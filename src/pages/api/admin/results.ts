import type { APIRoute } from "astro";
import { createServerClient } from "../../../lib/supabase";
import { getSessionContext } from "../../../lib/session";
import { clearRankingCache } from "../../../lib/ranking";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerScore(value: unknown): value is number {
  return Number.isInteger(value);
}

export const GET: APIRoute = async ({ request }) => {
  const { isAdmin } = await getSessionContext(request);
  if (!isAdmin) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  const supabase = createServerClient(request, new Headers());

  const [groupMatchesResult, knockoutMatchesResult] = await Promise.all([
    supabase
      .from("matches")
      .select("id, home_result, away_result")
      .not("home_result", "is", null)
      .not("away_result", "is", null),
    supabase
      .from("knockout_matches")
      .select("id, home_team, away_team, home_result, away_result, penalties_winner"),
  ]);

  if (groupMatchesResult.error) {
    return json({ ok: false, error: groupMatchesResult.error.message }, 502);
  }

  if (knockoutMatchesResult.error) {
    return json({ ok: false, error: knockoutMatchesResult.error.message }, 502);
  }

  const results: Record<string, { home_result: number; away_result: number }> = {};
  (groupMatchesResult.data ?? []).forEach((m) => {
    results[m.id] = { home_result: m.home_result, away_result: m.away_result };
  });

  const knockoutResults: Record<string, { home_team: string; away_team: string; home_result: number | null; away_result: number | null; penalties_winner: "home" | "away" | null }> = {};
  (knockoutMatchesResult.data ?? []).forEach((match) => {
    knockoutResults[match.id] = {
      home_team: match.home_team || "",
      away_team: match.away_team || "",
      home_result: match.home_result,
      away_result: match.away_result,
      penalties_winner: match.penalties_winner,
    };
  });

  return json({ ok: true, results, knockoutResults });
};

export const POST: APIRoute = async ({ request }) => {
  const { isAdmin } = await getSessionContext(request);
  if (!isAdmin) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  const body = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const results = body.results;
  const knockoutResults = body.knockoutResults;

  if (!isRecord(results) && !isRecord(knockoutResults)) {
    return json({ ok: false, error: "results or knockoutResults object required" }, 400);
  }

  const supabase = createServerClient(request, new Headers());

  const updates = [];
  for (const [matchId, result] of Object.entries(isRecord(results) ? results : {})) {
    if (!isRecord(result)) {
      return json({ ok: false, error: `Invalid result for match ${matchId}` }, 400);
    }
    const home = result?.home_result;
    const away = result?.away_result;
    if (typeof home !== "number" || typeof away !== "number") {
      return json({ ok: false, error: `Invalid result for match ${matchId}` }, 400);
    }
    if (home < 0 || home > 20 || away < 0 || away > 20) {
      return json({ ok: false, error: `Score out of range for match ${matchId}` }, 400);
    }
    updates.push({ id: matchId, home_result: home, away_result: away });
  }

  const knockoutUpdates = [];
  for (const [matchId, result] of Object.entries(isRecord(knockoutResults) ? knockoutResults : {})) {
    if (!isRecord(result)) {
      return json({ ok: false, error: `Invalid knockout result for match ${matchId}` }, 400);
    }
    const home = result?.home_result;
    const away = result?.away_result;
    const penaltiesWinner = result?.penalties_winner ?? null;
    const homeTeam = typeof result?.home_team === "string" ? result.home_team.trim() : "";
    const awayTeam = typeof result?.away_team === "string" ? result.away_team.trim() : "";

    if ((home !== null || away !== null) && (!isIntegerScore(home) || !isIntegerScore(away))) {
      return json({ ok: false, error: `Invalid knockout result for match ${matchId}` }, 400);
    }

    if (isIntegerScore(home) && isIntegerScore(away) && (home < 0 || home > 20 || away < 0 || away > 20)) {
      return json({ ok: false, error: `Knockout score out of range for match ${matchId}` }, 400);
    }

    if (isIntegerScore(home) && isIntegerScore(away) && home === away && penaltiesWinner !== "home" && penaltiesWinner !== "away") {
      return json({ ok: false, error: `Penalty winner required for knockout draw ${matchId}` }, 400);
    }

    knockoutUpdates.push({
      id: matchId,
      home_team: homeTeam,
      away_team: awayTeam,
      home_result: isIntegerScore(home) ? home : null,
      away_result: isIntegerScore(away) ? away : null,
      penalties_winner: isIntegerScore(home) && isIntegerScore(away) && home === away ? penaltiesWinner : null,
    });
  }

  let updated = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from("matches")
      .update({ home_result: update.home_result, away_result: update.away_result })
      .eq("id", update.id);

    if (error) {
      return json({ ok: false, error: `Failed to update ${update.id}: ${error.message}` }, 502);
    }
    updated++;
  }

  for (const update of knockoutUpdates) {
    const { error } = await supabase
      .from("knockout_matches")
      .update({
        home_team: update.home_team,
        away_team: update.away_team,
        home_result: update.home_result,
        away_result: update.away_result,
        penalties_winner: update.penalties_winner,
      })
      .eq("id", update.id);

    if (error) {
      return json({ ok: false, error: `Failed to update knockout ${update.id}: ${error.message}` }, 502);
    }

    updated++;
  }

  if (updated > 0) {
    clearRankingCache();
  }

  return json({ ok: true, updated });
};
