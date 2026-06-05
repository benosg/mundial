import type { APIRoute } from "astro";
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

function isLocked() {
  return new Date() >= LOCK_CUTOFF;
}

async function resolvePlayer(request: Request) {
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
  const player_id = url.searchParams.get("player_id") ||
    (request.method === "POST" || request.method === "DELETE" ? (await request.clone().json().catch(() => ({}))).player_id : null);

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

  const body = await request.json();
  const { predictions } = body;

  if (!Array.isArray(predictions)) {
    return json({ ok: false, error: "predictions array required" }, 400);
  }

  const { supabase, player } = await resolvePlayer(request);

  if (!player) {
    return json({ ok: false, error: "Player not found" }, 404);
  }

  const rows = predictions
    .filter(
      (p: { match_id: string; home_score?: number; away_score?: number }) =>
        p.match_id && typeof p.home_score === "number" && typeof p.away_score === "number"
    )
    .map((p: { match_id: string; home_score: number; away_score: number }) => ({
      player_id: player.id,
      match_id: p.match_id,
      home_score: p.home_score,
      away_score: p.away_score,
    }));

  if (rows.length === 0) {
    return json({ ok: true, saved: 0 });
  }

  const { error } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "player_id,match_id" });

  if (error) {
    return json({ ok: false, error: error.message }, 502);
  }

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

  return json({ ok: true, deleted: true });
};
