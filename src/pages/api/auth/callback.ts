import type { APIRoute } from "astro";
import { createServerClient } from "../../../lib/supabase";

type CookieCollectorHeaders = Headers & {
  __setCookieList?: string[];
};

export const prerender = false;

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return redirect("/?error=missing_code");
  }

  const responseHeaders = new Headers();
  const supabase = createServerClient(request, responseHeaders);

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirect("/?error=auth_failed");
  }

  // Forward any Set-Cookie headers from the server client
  const cookies = (responseHeaders as CookieCollectorHeaders).__setCookieList ?? [];
  const finalHeaders = new Headers();
  finalHeaders.set("Location", "/");
  finalHeaders.set("Cache-Control", "no-cache");

  if (Array.isArray(cookies)) {
    cookies.forEach((c) => finalHeaders.append("Set-Cookie", c));
  }

  return new Response(null, { status: 302, headers: finalHeaders });
};
