import type { APIRoute } from "astro";
import { buildKnockoutPhaseStates, type WinnerSide } from "../../../lib/knockout";
import { createServerClient } from "../../../lib/supabase";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function resolvePlayer(request: Request) {
  const supabase = createServerClient(request, new Headers());
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data } = await supabase.from("players").select("id").eq("auth_user_id", session.user.id).maybeSingle();
    if (data) return { supabase, player: data };

    const { data: created } = await supabase
      .from("players")
      .insert({
        auth_user_id: session.user.id,
        browser_key: "",
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
        email: session.user.email || "",
        favorite_team: "",
        favorite_flag: "",
      })
      .select("id")
      .single();

    return { supabase, player: created ?? null };
  }

  const url = new URL(request.url);
  const body = request.method === "POST" ? await request.clone().json().catch(() => ({})) : {};
  const playerId = url.searchParams.get("player_id") || body.player_id;

  if (!playerId) {
    return { supabase, player: null };
  }

  const { data } = await supabase.from("players").select("id").eq("browser_key", playerId).maybeSingle();
  return { supabase, player: data ?? null };
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { phase, predictions } = body;

  if (typeof phase !== "string" || !Array.isArray(predictions)) {
    return json({ ok: false, error: "phase and predictions are required" }, 400);
  }

  const { supabase, player } = await resolvePlayer(request);
  if (!player) return json({ ok: false, error: "Player not found" }, 404);

  const [groupMatchesResult, knockoutMatchesResult] = await Promise.all([
    supabase.from("matches").select("home_result, away_result"),
    supabase.from("knockout_matches").select("id, phase, kickoff_at, home_result, away_result, penalties_winner"),
  ]);

  if (groupMatchesResult.error) return json({ ok: false, error: groupMatchesResult.error.message }, 502);
  if (knockoutMatchesResult.error) return json({ ok: false, error: knockoutMatchesResult.error.message }, 502);

  const phaseStates = buildKnockoutPhaseStates(groupMatchesResult.data ?? [], knockoutMatchesResult.data ?? []);
  const phaseState = phaseStates[phase as keyof typeof phaseStates];

  if (!phaseState?.editable) {
    return json({ ok: false, error: `La fase ${phase} no está habilitada para editar.` }, 403);
  }

  const phaseMatchIds = new Set((knockoutMatchesResult.data ?? []).filter((match) => match.phase === phase).map((match) => match.id));
  const rows = predictions.map((prediction: { match_id: string; home_score: number; away_score: number; penalties_winner?: WinnerSide | null }) => {
    if (!phaseMatchIds.has(prediction.match_id)) {
      throw new Error(`El partido ${prediction.match_id} no pertenece a la fase ${phase}`);
    }

    if (!Number.isInteger(prediction.home_score) || !Number.isInteger(prediction.away_score)) {
      throw new Error(`Resultado inválido para ${prediction.match_id}`);
    }

    if (prediction.home_score < 0 || prediction.home_score > 20 || prediction.away_score < 0 || prediction.away_score > 20) {
      throw new Error(`Marcador fuera de rango para ${prediction.match_id}`);
    }

    const penaltiesWinner = prediction.home_score === prediction.away_score ? prediction.penalties_winner ?? null : null;
    if (prediction.home_score === prediction.away_score && penaltiesWinner !== "home" && penaltiesWinner !== "away") {
      throw new Error(`Debes elegir ganador por penales para ${prediction.match_id}`);
    }

    return {
      player_id: player.id,
      match_id: prediction.match_id,
      home_score: prediction.home_score,
      away_score: prediction.away_score,
      penalties_winner: penaltiesWinner,
    };
  });

  if (rows.length === 0) {
    return json({ ok: true, saved: 0 });
  }

  const { error } = await supabase.from("bracket_predictions").upsert(rows, { onConflict: "player_id,match_id" });
  if (error) return json({ ok: false, error: error.message }, 502);

  return json({ ok: true, saved: rows.length });
};
