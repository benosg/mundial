import type { APIRoute } from "astro";
import { getResultsSyncIntervalMs, syncFifaResults } from "../../../lib/results-sync";

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
  try {
    const result = await syncFifaResults({ request });

    return json({
      ...result,
      refreshEveryMs: 30_000,
      upstreamThrottleMs: getResultsSyncIntervalMs(),
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo actualizar con FIFA",
        refreshEveryMs: 30_000,
        upstreamThrottleMs: getResultsSyncIntervalMs(),
      },
      502,
    );
  }
};
