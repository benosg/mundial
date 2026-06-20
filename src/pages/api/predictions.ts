import type { APIRoute } from "astro";
import { clearRankingCache } from "../../lib/ranking";
import { createServerClient } from "../../lib/supabase";

export const prerender = false;

const FIRST_MATCH_KICKOFF = new Date("2026-06-11T15:00:00-04:00");
const LOCK_CUTOFF = new Date(FIRST_MATCH_KICKOFF.getTime() - 60 * 60 * 1000);

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

function isLocked() {
  return new Date() >= LOCK_CUTOFF;
}

async function resolvePlayer(request: Request, parsedBody?: Record<string, unknown>) {
  const supabase = createServerClient(request, new Headers());
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data, error } = await supabase
      .from("players")
      .select("id")
      .eq("auth_user_id", session.user.id)
      .single();

    if (error || !data) return { supabase, player: null };
    return { supabase, player: data };
  }

  const url = new URL(request.url);
  const body = parsedBody ?? (request.method === "POST" || request.method === "DELETE"
    ? await request.clone().json().catch(() => ({}))
    : {});
  const bodyPlayerId = isRecord(body) && typeof body.player_id === "string" ? body.player_id : null;
  const player_id = url.searchParams.get("player_id") || bodyPlayerId;

  if (player_id) {
    const { data, error } = await supabase
      .from("players")
      .select("id")
      .eq("browser_key", player_id)
      .single();

    if (error || !data) return { supabase, player: null };
    return { supabase, player: data };
  }

  return { supabase, player: null };
}

export const POST: APIRoute = async ({ request }) => {
  if (isLocked()) {
    return json({ ok: false, error: "Los pronósticos están bloqueados. Ya pasó el plazo (1 hora antes del primer partido)." }, 403);
  }

  const body = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }
  const { predictions } = body;

  if (!Array.isArray(predictions)) {
    return json({ ok: false, error: "predictions array required" }, 400);
  }

  const { supabase, player } = await resolvePlayer(request, body);

  if (!player) {
    return json({ ok: false, error: "Player not found" }, 404);
  }

  const rows = [];
  for (const prediction of predictions) {
    if (!isRecord(prediction) || typeof prediction.match_id !== "string") {
      return json({ ok: false, error: "Predicción inválida" }, 400);
    }

    const homeScore = prediction.home_score;
    const awayScore = prediction.away_score;
    if (!isIntegerScore(homeScore) || !isIntegerScore(awayScore)) {
      return json({ ok: false, error: `Resultado inválido para ${prediction.match_id}` }, 400);
    }

    if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20) {
      return json({ ok: false, error: `Marcador fuera de rango para ${prediction.match_id}` }, 400);
    }

    rows.push({
      player_id: player.id,
      match_id: prediction.match_id,
      home_score: homeScore,
      away_score: awayScore,
    });
  }

  if (rows.length === 0) {
    return json({ ok: true, saved: 0 });
  }

  const { error } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "player_id,match_id" });

  if (error) {
    return json({ ok: false, error: error.message }, 502);
  }

  clearRankingCache();
  return json({ ok: true, saved: rows.length });
};

export const DELETE: APIRoute = async ({ request }) => {
  if (isLocked()) {
    return json({ ok: false, error: "Los pronósticos están bloqueados. Ya pasó el plazo (1 hora antes del primer partido)." }, 403);
  }

  const { supabase, player } = await resolvePlayer(request);

  if (!player) {
    return json({ ok: false, error: "Player not found" }, 404);
  }

  const { error } = await supabase
    .from("predictions")
    .delete()
    .eq("player_id", player.id);

  if (error) {
    return json({ ok: false, error: error.message }, 502);
  }

  clearRankingCache();
  return json({ ok: true, deleted: true });
};
