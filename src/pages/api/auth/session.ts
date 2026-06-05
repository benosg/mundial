import type { APIRoute } from "astro";
import { getSessionContext } from "../../../lib/session";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const { user, isAdmin } = await getSessionContext(request);

  return new Response(JSON.stringify({ ok: true, user, isAdmin }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
