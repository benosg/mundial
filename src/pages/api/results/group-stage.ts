import type { APIRoute } from "astro";
import { buildResultsTimeline } from "../../../lib/results-timeline";
import { getResultsSyncIntervalMs, syncFifaResults } from "../../../lib/results-sync";
import { createServerClient, isSupabaseConfigured } from "../../../lib/supabase";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  let syncResult: Awaited<ReturnType<typeof syncFifaResults>> | null = null;
  let syncError: string | null = null;

  if (isSupabaseConfigured) {
    try {
      syncResult = await syncFifaResults({ request });
    } catch (error) {
      syncError = error instanceof Error ? error.message : "No se pudo actualizar con FIFA";
    }
  }

  if (!isSupabaseConfigured) {
    const timeline = buildResultsTimeline();
    return json({
      ok: true,
      ...timeline,
      source: "local",
      syncError: "Supabase no está configurado.",
      refreshEveryMs: 30_000,
      upstreamThrottleMs: getResultsSyncIntervalMs(),
    });
  }

  try {
    const supabase = createServerClient(request, new Headers());
    const { data, error } = await supabase.from("matches").select("id, home_result, away_result");

    if (error) {
      return json({ ok: false, error: error.message }, 502);
    }

    const resultsById = Object.fromEntries(
      (data ?? []).map((match) => [
        match.id,
        {
          home_result: match.home_result,
          away_result: match.away_result,
        },
      ]),
    );

    const timeline = buildResultsTimeline(resultsById);

    return json({
      ok: true,
      ...timeline,
      source: syncResult?.source ?? "cache",
      throttled: syncResult?.throttled ?? false,
      lastSyncAt: syncResult?.lastSyncAt ?? null,
      nextSyncAt: syncResult?.nextSyncAt ?? null,
      suspiciousGroups: syncResult?.suspiciousGroups ?? [],
      syncError,
      refreshEveryMs: 30_000,
      upstreamThrottleMs: getResultsSyncIntervalMs(),
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudieron cargar los resultados",
        refreshEveryMs: 30_000,
        upstreamThrottleMs: getResultsSyncIntervalMs(),
      },
      502,
    );
  }
};
