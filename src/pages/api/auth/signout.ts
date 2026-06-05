import type { APIRoute } from "astro";
import { createServerClient } from "../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const responseHeaders = new Headers();
  const supabase = createServerClient(request, responseHeaders);

  await supabase.auth.signOut();

  const cookies = responseHeaders.getSetCookie?.() ?? [];
  const finalHeaders = new Headers();
  finalHeaders.set("Location", "/");
  finalHeaders.set("Cache-Control", "no-cache");

  if (typeof cookies === "string") {
    if (cookies) finalHeaders.set("Set-Cookie", cookies);
  } else if (Array.isArray(cookies)) {
    cookies.forEach((c) => finalHeaders.append("Set-Cookie", c));
  }

  return new Response(null, { status: 302, headers: finalHeaders });
};
