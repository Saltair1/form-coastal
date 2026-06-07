/**
 * Form Coastal — Update Worker
 * Receives a plain-text update from Adam, parses it with Claude,
 * commits the result to GitHub, triggers a Pages rebuild.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const { text } = body;
    if (!text?.trim()) return json({ error: "No text provided" }, 400);

    const parseRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are the data updater for Form Coastal, a men's supplement startup. Adam will give you a voice memo or note. Parse it and return a JSON object describing what to update.

You can update two files:
- status.json: manufacturers array (name, status, notes) and milestones array (task, status, date)
- economics.json: any pricing or cost fields

Valid manufacturer statuses: "awaiting_quote", "quote_received", "selected", "declined"
Valid milestone statuses: "pending", "done"

Return ONLY valid JSON in this shape (omit keys you don't need to change):
{
  "summary": "one sentence of what changed",
  "status_updates": {
    "manufacturers": [{ "name": "exact name match", "status": "new_status", "notes": "updated notes" }],
    "milestones": [{ "task": "exact task text match", "status": "done", "date": "YYYY-MM" }]
  },
  "economics_updates": {
    "cogs_actual_usd": 15.50
  }
}

Milestone list — use the closest matching task text:
- "Rename TikTok + Instagram to @formcoastal"
- "Purchase formcoastal.com"
- "Get EIN for Salt Air Industries LLC"
- "Open Mercury business bank account"
- "Receive manufacturer quotes"
- "Post first TikTok as FORM"
- "Sign up for Helium 10, run Cerebro on Heliocare B0DLLHVQP1"
- "Lock formula with manufacturer"
- "Design label in Canva Pro"
- "Place first inventory order (250-500 units)"
- "Open Amazon Professional Seller account"
- "Open Shopify"
- "Build Amazon listing and launch"

Be aggressive about matching — "Mercury account", "bank account", "opened Mercury" all match "Open Mercury business bank account". "got my EIN" matches "Get EIN for Salt Air Industries LLC".

If nothing maps, return: { "summary": "noted but no data to update", "status_updates": {}, "economics_updates": {} }`,
        messages: [{ role: "user", content: text }],
      }),
    });

    const parseData = await parseRes.json();
    const parsed = parseData.content?.[0]?.text || "";

    let updates;
    try {
      const match = parsed.match(/\{[\s\S]*\}/);
      updates = JSON.parse(match[0]);
    } catch {
      return json({ error: "Could not parse Claude response", raw: parsed }, 500);
    }

    const [statusFile, economicsFile] = await Promise.all([
      ghGet(env, "data/status.json"),
      ghGet(env, "data/economics.json"),
    ]);

    let status = JSON.parse(atob(statusFile.content));
    let economics = JSON.parse(atob(economicsFile.content));

    if (updates.status_updates?.manufacturers) {
      for (const mu of updates.status_updates.manufacturers) {
        const m = status.manufacturers?.find(x => x.name.toLowerCase().includes(mu.name.toLowerCase()));
        if (m) { if (mu.status) m.status = mu.status; if (mu.notes) m.notes = mu.notes; }
      }
    }

    if (updates.status_updates?.milestones) {
      for (const mu of updates.status_updates.milestones) {
        const needle = mu.task.toLowerCase();
        const words = needle.split(/\s+/).filter(w => w.length > 3);
        const m = status.milestones?.find(x => {
          const hay = x.task.toLowerCase();
          return hay.includes(needle) || words.filter(w => hay.includes(w)).length >= 2;
        });
        if (m) { if (mu.status) m.status = mu.status; if (mu.date) m.date = mu.date; }
      }
    }

    if (updates.economics_updates) {
      Object.assign(economics, updates.economics_updates);
    }

    status.last_updated = new Date().toISOString().slice(0, 10);

    await Promise.all([
      ghPut(env, "data/status.json", statusFile.sha, JSON.stringify(status, null, 2), `update: ${updates.summary}`),
      ghPut(env, "data/economics.json", economicsFile.sha, JSON.stringify(economics, null, 2), `update: ${updates.summary}`),
    ]);

    // Trigger dashboard rebuild via GitHub Actions
    await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/rebuild-dashboard.yml/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": "form-coastal-worker" },
      body: JSON.stringify({ ref: "main" }),
    });

    return json({ ok: true, summary: updates.summary }, 200);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

async function ghGet(env, path) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, "User-Agent": "form-coastal-worker" },
  });
  return res.json();
}

async function ghPut(env, path, sha, content, message) {
  return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, "Content-Type": "application/json", "User-Agent": "form-coastal-worker" },
    body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(content))), sha }),
  });
}
