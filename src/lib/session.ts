import { createServerClient } from "./supabase";
import { getRankingPositionForAuthUser } from "./ranking";

export interface SessionContext {
  user: null | {
    id: string;
    email: string;
    name: string;
    avatar: string;
  };
  isAdmin: boolean;
  rankingPosition: number | null;
}

/**
 * Reads the Supabase session from the request cookies and looks up
 * whether the logged-in user is an admin (players.is_admin = true).
 * Also returns the player's current ranking position when available.
 *
 * Returns user=null, isAdmin=false, rankingPosition=null when no session is present.
 */
export async function getSessionContext(request: Request): Promise<SessionContext> {
  const supabase = createServerClient(request, new Headers());
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { user: null, isAdmin: false, rankingPosition: null };
  }

  const [{ data: player }, rankingPosition] = await Promise.all([
    supabase
    .from("players")
    .select("is_admin")
    .eq("auth_user_id", session.user.id)
    .maybeSingle(),
    getRankingPositionForAuthUser(supabase, session.user.id),
  ]);

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "",
      avatar: session.user.user_metadata?.avatar_url ?? "",
    },
    isAdmin: Boolean(player?.is_admin),
    rankingPosition,
  };
}
