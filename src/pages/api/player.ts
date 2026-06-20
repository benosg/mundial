import type { APIRoute } from "astro";
import { createServerClient } from "../../lib/supabase";
import { getFlag } from "../../lib/flags";
import { clearRankingCache } from "../../lib/ranking";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { player_id, name, favorite_team } = body;

  if (typeof name !== "string" || typeof favorite_team !== "string") {
    return json({ ok: false, error: "name and favorite_team are required" }, 400);
  }

  const responseHeaders = new Headers();
  const supabase = createServerClient(request, responseHeaders);

  // Check for authenticated session
  const { data: { session } } = await supabase.auth.getSession();

  const favorite_flag = getFlag(favorite_team);

  if (session) {
    // Authenticated flow — find or create by auth_user_id
    const { data: existingPlayer, error: lookupErr } = await supabase
      .from("players")
      .select("id, favorite_team")
      .eq("auth_user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lookupErr && lookupErr.code !== "PGRST116") {
      return json({ ok: false, error: lookupErr.message }, 502);
    }

    if (existingPlayer) {
      // Only update name + email; favorite_team is locked after first set
      const updateData: Record<string, string> = {
        name: name || session.user.user_metadata?.full_name || "",
        email: session.user.email || "",
      };
      if (!existingPlayer.favorite_team) {
        updateData.favorite_team = favorite_team;
        updateData.favorite_flag = favorite_flag;
      }

      const { data, error } = await supabase
        .from("players")
        .update(updateData)
        .eq("id", existingPlayer.id)
        .select();

      if (error) return json({ ok: false, error: error.message }, 502);

      clearRankingCache();
      return json({
        ok: true,
        player: data?.[0]
          ? { id: data[0].id, name: data[0].name, favorite_team: data[0].favorite_team, favorite_flag: data[0].favorite_flag }
          : null,
      });
    }

    // Create new player for authenticated user
    const { data, error } = await supabase
      .from("players")
      .insert({
        auth_user_id: session.user.id,
        browser_key: "",
        name: name || session.user.user_metadata?.full_name || "",
        email: session.user.email || "",
        favorite_team,
        favorite_flag,
      })
      .select();

    if (error) return json({ ok: false, error: error.message }, 502);

    clearRankingCache();
    return json({
      ok: true,
      player: data?.[0]
        ? { id: data[0].id, name: data[0].name, favorite_team: data[0].favorite_team, favorite_flag: data[0].favorite_flag }
        : null,
    });
  }

  // Anonymous browser-key flow (backward compatibility)
  if (!player_id) {
    return json({ ok: false, error: "player_id is required for anonymous users" }, 400);
  }

  const { data: existingPlayers, error: lookupError } = await supabase
    .from("players")
    .select("id")
    .eq("browser_key", player_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (lookupError) {
    return json({ ok: false, error: lookupError.message }, 502);
  }

  const existingPlayer = existingPlayers?.[0];

  const mutation = existingPlayer
    ? await supabase
        .from("players")
        .update({ name, favorite_team, favorite_flag })
        .eq("id", existingPlayer.id)
        .select()
    : await supabase
        .from("players")
        .insert({ browser_key: player_id, name, favorite_team, favorite_flag })
        .select();

  const { data, error } = mutation;

  if (error) {
    return json({ ok: false, error: error.message }, 502);
  }

  const player = data?.[0];

  if (!player) {
    return json({ ok: false, error: "No se pudo guardar el perfil del jugador" }, 502);
  }

  clearRankingCache();
  return json({
    ok: true,
    player: {
      id: player.id,
      name: player.name,
      favorite_team: player.favorite_team,
      favorite_flag: player.favorite_flag,
    },
  });
};
