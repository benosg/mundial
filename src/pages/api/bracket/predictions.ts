import type { APIRoute } from "astro";
import { fetchFifaKnockoutMatchUpdates } from "../../../lib/fifa-results";
import { buildKnockoutPhaseStates, resolveKnockoutMatches, type WinnerSide } from "../../../lib/knockout";
import { clearRankingCache } from "../../../lib/ranking";
import { createServerClient } from "../../../lib/supabase";

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

function isEditableDefinedMatch(match: {
  home_slot: string;
  away_slot: string;
  home_team: string;
  away_team: string;
}) {
  return match.home_team !== match.home_slot && match.away_team !== match.away_slot;
}

async function resolvePlayer(request: Request, parsedBody?: Record<string, unknown>) {
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
  const body = parsedBody ?? (request.method === "POST" ? await request.clone().json().catch(() => ({})) : {});
  const bodyPlayerId = isRecord(body) && typeof body.player_id === "string" ? body.player_id : null;
  const playerId = url.searchParams.get("player_id") || bodyPlayerId;

  if (!playerId) {
    return { supabase, player: null };
  }

  const { data } = await supabase.from("players").select("id").eq("browser_key", playerId).maybeSingle();
  return { supabase, player: data ?? null };
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const { phase, predictions } = body;

  if (typeof phase !== "string" || !Array.isArray(predictions)) {
    return json({ ok: false, error: "phase and predictions are required" }, 400);
  }

  const { supabase, player } = await resolvePlayer(request, body);
  if (!player) return json({ ok: false, error: "Player not found" }, 404);

  const [groupMatchesResult, knockoutMatchesResult, fifaKnockoutUpdates] = await Promise.all([
    supabase.from("matches").select("home_result, away_result"),
    supabase.from("knockout_matches").select("id, phase, home_slot, away_slot, home_team, away_team, kickoff_at"),
    fetchFifaKnockoutMatchUpdates().catch(() => []),
  ]);

  if (groupMatchesResult.error) return json({ ok: false, error: groupMatchesResult.error.message }, 502);
  if (knockoutMatchesResult.error) return json({ ok: false, error: knockoutMatchesResult.error.message }, 502);

  const knockoutMatches = resolveKnockoutMatches(knockoutMatchesResult.data ?? [], fifaKnockoutUpdates);
  const phaseMatches = knockoutMatches.filter((match) => match.phase === phase);
  if (phaseMatches.length === 0) {
    return json({ ok: false, error: `La fase ${phase} no existe.` }, 400);
  }

  const phaseStates = buildKnockoutPhaseStates(groupMatchesResult.data ?? [], knockoutMatches);
  const phaseState = phaseStates[phase as keyof typeof phaseStates];
  if (!phaseState?.editable) {
    return json({ ok: false, error: `La fase ${phase} no está habilitada para editar.` }, 403);
  }

  const phaseMatchIds = new Set(phaseMatches.map((match) => match.id));
  const editableMatchIds = new Set(
    phaseMatches
      .filter((match) => isEditableDefinedMatch(match))
      .map((match) => match.id)
  );
  const rows = [];

  for (const prediction of predictions) {
    if (!isRecord(prediction) || typeof prediction.match_id !== "string") {
      return json({ ok: false, error: "Predicción inválida" }, 400);
    }

    const matchId = prediction.match_id;
    const homeScore = prediction.home_score;
    const awayScore = prediction.away_score;
    const requestedPenaltiesWinner = prediction.penalties_winner;

    if (!phaseMatchIds.has(matchId)) {
      return json({ ok: false, error: `El partido ${matchId} no pertenece a la fase ${phase}` }, 400);
    }

    if (!editableMatchIds.has(matchId)) {
      return json({ ok: false, error: `El partido ${matchId} no está habilitado para editar.` }, 403);
    }

    if (!isIntegerScore(homeScore) || !isIntegerScore(awayScore)) {
      return json({ ok: false, error: `Resultado inválido para ${matchId}` }, 400);
    }

    if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20) {
      return json({ ok: false, error: `Marcador fuera de rango para ${matchId}` }, 400);
    }

    const penaltiesWinner = homeScore === awayScore ? requestedPenaltiesWinner ?? null : null;
    if (homeScore === awayScore && penaltiesWinner !== "home" && penaltiesWinner !== "away") {
      return json({ ok: false, error: `Debes elegir ganador por penales para ${matchId}` }, 400);
    }

    rows.push({
      player_id: player.id,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      penalties_winner: penaltiesWinner as WinnerSide | null,
    });
  }

  if (rows.length === 0) {
    return json({ ok: true, saved: 0 });
  }

  const { error } = await supabase.from("bracket_predictions").upsert(rows, { onConflict: "player_id,match_id" });
  if (error) return json({ ok: false, error: error.message }, 502);

  clearRankingCache();
  return json({ ok: true, saved: rows.length });
};
