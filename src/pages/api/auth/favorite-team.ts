import type { APIRoute } from "astro";
import { createServerClient } from "../../../lib/supabase";
import { getFlag } from "../../../lib/flags";
import { clearRankingCache } from "../../../lib/ranking";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { favorite_team } = body;

  if (!favorite_team || typeof favorite_team !== "string") {
    return json({ ok: false, error: "favorite_team is required" }, 400);
  }

  const supabase = createServerClient(request, new Headers());

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return json({ ok: false, error: "Not authenticated" }, 401);
  }

  const { data: player, error: playerErr } = await supabase
    .from("players")
    .select("id, favorite_team")
    .eq("auth_user_id", session.user.id)
    .single();

  if (playerErr || !player) {
    return json({ ok: false, error: "Player not found" }, 404);
  }

  if (player.favorite_team && player.favorite_team !== "") {
    return json({
      ok: false,
      error: "Tu país favorito ya está fijado y no se puede cambiar.",
    }, 400);
  }

  const favorite_flag = getFlag(favorite_team);

  const { error } = await supabase
    .from("players")
    .update({ favorite_team, favorite_flag })
    .eq("id", player.id);

  if (error) {
    return json({ ok: false, error: error.message }, 502);
  }

  clearRankingCache();
  return json({
    ok: true,
    player: {
      id: player.id,
      favorite_team,
      favorite_flag,
    },
  });
};
