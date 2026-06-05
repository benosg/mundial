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

  const { data: matches, error } = await supabase
    .from("matches")
    .select("id, home_result, away_result")
    .not("home_result", "is", null)
    .not("away_result", "is", null);

  if (error) {
    return json({ ok: false, error: error.message }, 502);
  }

  const results: Record<string, { home_result: number; away_result: number }> = {};
  (matches ?? []).forEach((m) => {
    results[m.id] = { home_result: m.home_result, away_result: m.away_result };
  });

  return json({ ok: true, results });
};

export const POST: APIRoute = async ({ request }) => {
  const { isAdmin } = await getSessionContext(request);
  if (!isAdmin) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  const body = await request.json();
  const { results } = body;

  if (!results || typeof results !== "object") {
    return json({ ok: false, error: "results object required" }, 400);
  }

  const supabase = createServerClient(request, new Headers());

  const updates = Object.entries(results).map(([matchId, result]: [string, any]) => {
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

  return json({ ok: true, updated });
};