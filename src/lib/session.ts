import { createServerClient } from "./supabase";

export interface SessionContext {
  user: null | {
    id: string;
    email: string;
    name: string;
    avatar: string;
  };
  isAdmin: boolean;
}

/**
 * Reads the Supabase session from the request cookies and looks up
 * whether the logged-in user is an admin (players.is_admin = true).
 *
 * Returns user=null, isAdmin=false when no session is present.
 */
export async function getSessionContext(request: Request): Promise<SessionContext> {
  const supabase = createServerClient(request, new Headers());
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    return { user: null, isAdmin: false };
  }

  const { data: player } = await supabase
    .from("players")
    .select("is_admin")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "",
      avatar: session.user.user_metadata?.avatar_url ?? "",
    },
    isAdmin: Boolean(player?.is_admin),
  };
}
