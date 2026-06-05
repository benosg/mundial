import { createBrowserClient } from "@supabase/ssr";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";

function readEnv(name: "SUPABASE_URL" | "SUPABASE_KEY") {
  return import.meta.env[name] ?? process.env[name];
}

const supabaseUrl = readEnv("SUPABASE_URL");
const supabaseKey = readEnv("SUPABASE_KEY");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

function requireEnv() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables.");
  }
}

/* ---------- Browser client (singleton, for client-side scripts) ---------- */

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  requireEnv();
  browserClient = createBrowserClient(supabaseUrl!, supabaseKey!);
  return browserClient;
}

/* ---------- Server client (per-request, cookie-aware) ---------- */

interface CookiePair {
  name: string;
  value: string;
}

type CookieCollectorHeaders = Headers & {
  __setCookieList?: string[];
};

function parseCookiesFromHeader(header: string | null): CookiePair[] {
  if (!header) return [];
  return header.split(";").map((c) => {
    const [name, ...rest] = c.split("=");
    return { name: name.trim(), value: rest.join("=").trim() };
  });
}

export function createServerClient(request?: Request, responseHeaders?: Headers) {
  requireEnv();

  const cookieHeader = request?.headers?.get("Cookie") ?? null;
  const cookies = parseCookiesFromHeader(cookieHeader);

  return createSupabaseServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll: () => cookies,
      setAll: (cookiesToSet) => {
        if (!responseHeaders) return;
        const cookieHeaders = responseHeaders as CookieCollectorHeaders;
          cookieHeaders.__setCookieList ??= [];

          cookiesToSet.forEach(({ name, value, options }) => {
            const parts = [`${name}=${value}`, "Path=/", "SameSite=Lax"];
            if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`);
            if (options?.domain) parts.push(`Domain=${options.domain}`);
            if (options?.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
            if (options?.secure) parts.push("Secure");
            const serialized = parts.join("; ");
            cookieHeaders.__setCookieList!.push(serialized);
          responseHeaders.append("Set-Cookie", serialized);
        });
      },
    },
  });
}

/* ---------- Legacy alias (used by supabase-status, etc.) ---------- */

let legacyClient: ReturnType<typeof createServerClient> | null = null;

export function getSupabaseServerClient() {
  if (legacyClient) return legacyClient;
  legacyClient = createServerClient();
  return legacyClient;
}

export const getSupabase = getSupabaseServerClient;
