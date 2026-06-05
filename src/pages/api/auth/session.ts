import type { APIRoute } from "astro";
import { createServerClient } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const responseHeaders = new Headers();
  const supabase = createServerClient(request, responseHeaders);

  const { data: { session } } = await supabase.auth.getSession();

  const result = session
    ? {
        ok: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "",
          avatar: session.user.user_metadata?.avatar_url ?? "",
        },
      }
    : { ok: true, user: null };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
