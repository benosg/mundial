import type { APIRoute } from "astro";
import { getSupabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_KEY;

  if (!url || !key) {
    return new Response(
      JSON.stringify({
        ok: false,
        configured: false,
        message: "Missing SUPABASE_URL or SUPABASE_KEY env vars.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = getSupabase();

    const { error } = await supabase
      .from("_supabase_healthcheck")
      .select("*")
      .limit(1);

    if (error && error.code !== "42P01") {
      return new Response(
        JSON.stringify({
          ok: false,
          configured: true,
          verified: false,
          error: error.message,
          code: error.code,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const tableMissing = error?.code === "42P01";

    return new Response(
      JSON.stringify({
        ok: true,
        configured: true,
        verified: !tableMissing,
        url,
        message: tableMissing
          ? "Connection works. No app tables exist yet — create your first table in the Supabase dashboard."
          : "Connection works.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ ok: false, configured: true, verified: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
