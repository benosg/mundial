import type { APIRoute } from "astro";
import { syncFifaResults } from "../../../../lib/results-sync";
import { getSessionContext } from "../../../../lib/session";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const { isAdmin } = await getSessionContext(request);
  if (!isAdmin) {
    return json({ ok: false, error: "No autorizado" }, 401);
  }

  try {
    const result = await syncFifaResults({ request, force: true });
    return json(result);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo sincronizar con FIFA",
      },
      502,
    );
  }
};
