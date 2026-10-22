// Importação do Google Agenda (substitui o conector "Nexo Google Calendar" do Base44).
// POST (com JWT do usuário): { action: 'connect' | 'disconnect' | 'status' | 'calendars' | 'events', ... }
// GET  ?code&state: retorno do OAuth do Google; guarda o refresh token e volta para o app.
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e (opcional) APP_URL.
import { createClient } from "npm:@supabase/supabase-js@2";

const API = "https://www.googleapis.com/calendar/v3";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const APP_URL = Deno.env.get("APP_URL") || "";
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar`;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ---------------------------------------------------------------- state assinado (HMAC)
const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));
const hmacKey = crypto.subtle.importKey("raw", enc.encode(SERVICE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

async function signState(data: Record<string, unknown>) {
  const body = b64url(enc.encode(JSON.stringify(data)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey, enc.encode(body));
  return `${body}.${b64url(sig)}`;
}
async function readState(state: string) {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = b64url(await crypto.subtle.sign("HMAC", await hmacKey, enc.encode(body)));
  if (expected !== sig) return null;
  const data = JSON.parse(fromB64url(body));
  if (Date.now() - data.t > 15 * 60 * 1000) return null;
  return data as { e: string; r: string; t: number };
}

const safeReturn = (url: string) => {
  try {
    const u = new URL(url);
    if (APP_URL && u.origin !== new URL(APP_URL).origin) return APP_URL;
    if (u.protocol !== "https:" && u.hostname !== "localhost") return APP_URL || "/";
    return u.toString();
  } catch {
    return APP_URL || "/";
  }
};

// ---------------------------------------------------------------- tokens
async function tokenRequest(params: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error_description || data.error || `Google ${res.status}`), { status: res.status, code: data.error });
  return data;
}

async function accessTokenFor(email: string): Promise<string | null> {
  const { data: row } = await admin.from("google_connection").select("*").eq("user_email", email).maybeSingle();
  if (!row) return null;
  if (row.access_token && row.expires_at && new Date(row.expires_at).getTime() > Date.now() + 60_000) return row.access_token;
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: row.refresh_token });
    await admin.from("google_connection").update({
      access_token: t.access_token,
      expires_at: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(),
      updated_date: new Date().toISOString(),
    }).eq("user_email", email);
    return t.access_token;
  } catch (err) {
    // invalid_grant: token revogado ou expirado (no modo teste o Google expira em 7 dias).
    if ((err as { code?: string }).code === "invalid_grant") {
      await admin.from("google_connection").delete().eq("user_email", email);
      return null;
    }
    throw err;
  }
}

async function google(token: string, path: string, query: Record<string, string> = {}) {
  const url = new URL(API + path);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || `Google API ${res.status}`), { status: res.status });
  return data;
}

// Data local (yyyy-MM-dd) de um início/fim de evento do Google.
const day = (t: { date?: string; dateTime?: string } = {}) => (t.date || t.dateTime || "").slice(0, 10);

function toEvent(e: any, calendarId: string) {
  const allDay = !!e.start?.date;
  let end = day(e.end);
  if (allDay && end) {
    // No Google, o fim de um evento de dia inteiro é exclusivo.
    const d = new Date(end + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    end = d.toISOString().slice(0, 10);
  }
  return {
    id: e.id,
    calendarId,
    title: e.summary || "(Sem título)",
    description: e.description || "",
    location: e.location || "",
    allDay,
    start: e.start?.dateTime || e.start?.date || null,
    end: e.end?.dateTime || e.end?.date || null,
    startDate: day(e.start),
    endDate: end || day(e.start),
    htmlLink: e.htmlLink || "",
  };
}

// ---------------------------------------------------------------- handler
async function callback(url: URL) {
  const state = await readState(url.searchParams.get("state") || "");
  if (!state) return new Response("Link de autorização inválido ou expirado.", { status: 400 });
  const back = new URL(safeReturn(state.r));
  const code = url.searchParams.get("code");
  if (!code) {
    back.searchParams.set("gcal_error", url.searchParams.get("error") || "cancelled");
    return Response.redirect(back.toString(), 302);
  }
  const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI });
  const { data: prev } = await admin.from("google_connection").select("refresh_token").eq("user_email", state.e).maybeSingle();
  const refresh = t.refresh_token || prev?.refresh_token;
  if (!refresh) return new Response("O Google não devolveu um refresh token. Tente conectar de novo.", { status: 400 });
  await admin.from("google_connection").upsert({
    user_email: state.e,
    refresh_token: refresh,
    access_token: t.access_token,
    expires_at: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(),
    updated_date: new Date().toISOString(),
  });
  return Response.redirect(back.toString(), 302);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  if (req.method === "GET") return callback(url).catch((e) => new Response(String(e.message), { status: 500 }));
  if (!CLIENT_ID || !CLIENT_SECRET) return json({ error: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados" }, 500);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user?.email) return json({ error: "Unauthorized" }, 401);
  const email = user.email.toLowerCase();

  const { action, calendarId = "primary", timeMin, timeMax, returnUrl = "" } = await req.json().catch(() => ({}));

  try {
    if (action === "connect") {
      const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      auth.search = new URLSearchParams({
        client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, response_type: "code", scope: SCOPES.join(" "),
        access_type: "offline", prompt: "consent", include_granted_scopes: "true", login_hint: email,
        state: await signState({ e: email, r: returnUrl, t: Date.now() }),
      }).toString();
      return json({ url: auth.toString() });
    }

    if (action === "disconnect") {
      const { data: row } = await admin.from("google_connection").select("refresh_token").eq("user_email", email).maybeSingle();
      if (row) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(row.refresh_token)}`, { method: "POST" }).catch(() => {});
        await admin.from("google_connection").delete().eq("user_email", email);
      }
      return json({ connected: false });
    }

    const token = await accessTokenFor(email);
    if (!token) return json({ connected: false });

    if (action === "status") return json({ connected: true });

    if (action === "calendars") {
      const data = await google(token, "/users/me/calendarList", { minAccessRole: "reader" });
      const calendars = (data.items || []).map((c: any) => ({
        id: c.id, name: c.summaryOverride || c.summary, primary: !!c.primary, color: c.backgroundColor || null,
      }));
      return json({ connected: true, calendars });
    }

    if (action === "events") {
      if (!timeMin || !timeMax) return json({ error: "timeMin e timeMax são obrigatórios" }, 400);
      const events: unknown[] = [];
      let pageToken = "";
      do {
        const data = await google(token, `/calendars/${encodeURIComponent(calendarId)}/events`, {
          timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "250",
          ...(pageToken ? { pageToken } : {}),
        });
        (data.items || []).filter((e: any) => e.status !== "cancelled").forEach((e: any) => events.push(toEvent(e, calendarId)));
        pageToken = data.nextPageToken || "";
      } while (pageToken && events.length < 1000);
      return json({ connected: true, events });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401 || status === 403) return json({ connected: false, reconnect: true });
    return json({ error: (err as Error).message }, 502);
  }
});
