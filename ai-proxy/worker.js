/**
 * Cloudflare Worker — Anthropic (Claude) proxy for the Spanish Vocab app.
 *
 * Keeps your Anthropic API key OFF the public web page. The app calls this
 * Worker; the Worker adds the secret key and calls Claude.
 *
 * Secrets / variables to set in the Cloudflare dashboard (Settings → Variables):
 *   ANTHROPIC_API_KEY  (Secret, required)  your key from console.anthropic.com
 *   APP_TOKEN          (Secret, optional)  a random string; the app must send it
 *   ALLOWED_ORIGIN     (Var,    optional)  e.g. https://rasoolzandvakil-boop.github.io
 *
 * See README.md in this folder for step-by-step deploy instructions.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-3-5-haiku-20241022"; // fast + inexpensive

export default {
  async fetch(request, env) {
    const allow = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": allow,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);

    if (env.APP_TOKEN && request.headers.get("X-App-Token") !== env.APP_TOKEN) {
      return json({ error: "unauthorized" }, 401, cors);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "server missing ANTHROPIC_API_KEY" }, 500, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid JSON" }, 400, cors); }
    if (!Array.isArray(body.messages) || !body.messages.length) {
      return json({ error: "messages[] required" }, 400, cors);
    }

    const payload = {
      model: body.model || DEFAULT_MODEL,
      max_tokens: Math.min(Number(body.max_tokens) || 1024, 2048),
      messages: body.messages,
    };
    if (body.system) payload.system = String(body.system);

    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      return json({ error: "upstream fetch failed: " + e.message }, 502, cors);
    }

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return json({ error: (data && data.error && data.error.message) || "Claude API error", status: upstream.status }, upstream.status, cors);
    }
    const text = (data.content || []).map((c) => c.text || "").join("");
    return json({ text }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
