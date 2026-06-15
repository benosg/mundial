import type { APIRoute } from "astro";
import { createServerClient } from "../../../lib/supabase";
import { getSessionContext } from "../../../lib/session";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

  const body = await request.json();
  const { results, knockoutResults } = body;

  if ((!results || typeof results !== "object") && (!knockoutResults || typeof knockoutResults !== "object")) {
    return json({ ok: false, error: "results or knockoutResults object required" }, 400);
  }

  const supabase = createServerClient(request, new Headers());

  const updates = Object.entries(results || {}).map(([matchId, result]: [string, any]) => {
    const home = result?.home_result;
    const away = result?.away_result;
    if (typeof home !== "number" || typeof away !== "number") {
      throw new Error(`Invalid result for match ${matchId}`);
    }
    if (home < 0 || home > 20 || away < 0 || away > 20) {
      throw new Error(`Score out of range for match ${matchId}`);
    }
    return { id: matchId, home_result: home, away_result: away };
  });

  const knockoutUpdates = Object.entries(knockoutResults || {}).map(([matchId, result]: [string, any]) => {
    const home = result?.home_result;
    const away = result?.away_result;
    const penaltiesWinner = result?.penalties_winner ?? null;
    const homeTeam = typeof result?.home_team === "string" ? result.home_team.trim() : "";
    const awayTeam = typeof result?.away_team === "string" ? result.away_team.trim() : "";

    if ((home !== null || away !== null) && (!Number.isInteger(home) || !Number.isInteger(away))) {
      throw new Error(`Invalid knockout result for match ${matchId}`);
    }

    if (Number.isInteger(home) && Number.isInteger(away) && (home < 0 || home > 20 || away < 0 || away > 20)) {
      throw new Error(`Knockout score out of range for match ${matchId}`);
    }

    if (Number.isInteger(home) && Number.isInteger(away) && home === away && penaltiesWinner !== "home" && penaltiesWinner !== "away") {
      throw new Error(`Penalty winner required for knockout draw ${matchId}`);
    }

    return {
      id: matchId,
      home_team: homeTeam,
      away_team: awayTeam,
      home_result: Number.isInteger(home) ? home : null,
      away_result: Number.isInteger(away) ? away : null,
      penalties_winner: Number.isInteger(home) && Number.isInteger(away) && home === away ? penaltiesWinner : null,
    };
  });

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

  return json({ ok: true, updated });
};
