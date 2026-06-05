import type { APIRoute } from "astro";
import { createServerClient } from "../../../lib/supabase";

type CookieCollectorHeaders = Headers & {
  __setCookieList?: string[];
};

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const callbackUrl = `${origin}/api/auth/callback`;
  const responseHeaders = new Headers();
  const supabase = createServerClient(request, responseHeaders);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return new Response(JSON.stringify({ error: error?.message ?? "No se pudo iniciar Google OAuth" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers();
  headers.set("Location", data.url);
  headers.set("Cache-Control", "no-cache");
  const cookies = (responseHeaders as CookieCollectorHeaders).__setCookieList ?? [];
  cookies.forEach((cookie) => headers.append("Set-Cookie", cookie));

  return new Response(null, { status: 302, headers });
};
