#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const https = require("https");

const role = process.argv[2];
if (!role) { console.error("Usage: node run-agent.js <role>"); process.exit(1); }

const root = path.join(__dirname, "..");
const roles = JSON.parse(fs.readFileSync(path.join(root, "roles.json"), "utf8"));
const agent = roles[role];
if (!agent) { console.error(`Unknown role: ${role}`); process.exit(1); }

const today = new Date().toISOString().slice(0, 10);
const claudeMd = fs.readFileSync(path.join(root, "CLAUDE.md"), "utf8");
const economics = fs.readFileSync(path.join(root, "data/economics.json"), "utf8");
const spendPath = path.join(root, "data/spend.json");
const spendData = JSON.parse(fs.readFileSync(spendPath, "utf8"));

function readFile(p) { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } }

// Enforce spend cap (skip for finance itself)
if (role !== "finance") {
  const month = today.slice(0, 7);
  const spent = spendData.runs.filter(r => r.date && r.date.startsWith(month)).reduce((s, r) => s + (r.cost_usd || 0), 0);
  if (spent >= spendData.monthly_cap_usd) {
    const msg = `TEAM PAUSED: $${spent.toFixed(2)} spent >= $${spendData.monthly_cap_usd} cap. Adam must reset data/spend.json.`;
    fs.writeFileSync(path.join(root, "output/TEAM_PAUSED.txt"), msg);
    console.error(msg); process.exit(1);
  }
}

const outDir = path.join(root, "output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const prompts = {
  director: `Today is ${today}. You are the Director for Form Coastal. Read CLAUDE.md and assign each worker their single most important task for today toward G1 > G2 > G3.

Format your output like this — no JSON, plain readable text:

## Today's Assignments

**Scout:** [task]

**Writer:** [task]

**Finance:** [task]

**Auditor:** [task]

**Director's note:** [one sentence on today's top priority and why]`,

  scout: `Today is ${today}. You are the Lead Scout for Form Coastal. Find 5 high-fit B2B prospects (gyms, surf shops, outdoor retailers, sports medicine practices) for a men's outdoor lifestyle supplement. Never invent emails.

Format as clean readable text:

## B2B Leads — ${today}

**1. [Business Name]**
Location: [city, state]
Why they fit: [one sentence]
Contact: [website or public contact method only]
Confidence: [High / Medium]

[repeat for each lead]`,

  writer: `Today is ${today}. You are the Copywriter for Form Coastal. Draft the following. Brand voice: coastal, clean, confident — not bro-y, not clinical. No health claims. Adam reviews and sends everything.

## TikTok Script — [Hook Title]
Format: [talking head / lifestyle / etc]
Length: ~35 seconds

**[HOOK — 0:00–0:05]**
[script]

**[VALUE — 0:05–0:25]**
[script]

**[CTA — 0:25–0:35]**
[script]

---

## B2B Outreach Email — DRAFT
**Subject:** [subject line]

[email body]

— Adam
Form Coastal`,

  finance: `Today is ${today}. Review the spend log and summarize this month's API usage in plain readable text.

## Finance Report — ${today.slice(0,7)}

**Month spend:** $X.XX of $20.00 cap (X%)
**Status:** OK / PAUSED
**Runs this month:** X
**Note:** [one sentence on trajectory]

Spend log: ${JSON.stringify(spendData)}`,

  auditor: `Today is ${today}. You are the Auditor for Form Coastal. Review today's outputs below and give a clear human-readable report.

## Audit Report — ${today}

**Overall: PASSED / FAILED**

**Writer output:**
- Brand voice: ✓ or ✗ [note]
- Health claims: ✓ clean or ✗ [flag]
- Compliance: ✓ or ✗ [note]

**Scout output:**
- Contacts verified: ✓ or ✗ [note]
- No invented emails: ✓ or ✗ [note]

**Flags:** [any issues, or "None"]

--- WRITER OUTPUT ---
${readFile(path.join(outDir, `writer-${today}.txt`))}

--- SCOUT OUTPUT ---
${readFile(path.join(outDir, `scout-${today}.txt`))}`,
};

const body = JSON.stringify({
  model: agent.model,
  max_tokens: 2048,
  system: `${agent.system}\n\n--- CLAUDE.md ---\n${claudeMd}\n\n--- Economics ---\n${economics}`,
  messages: [{ role: "user", content: prompts[role] }],
});

const req = https.request({
  hostname: "api.anthropic.com", path: "/v1/messages", method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
}, res => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => {
    if (res.statusCode !== 200) { console.error(`API error ${res.statusCode}: ${data}`); process.exit(1); }
    const parsed = JSON.parse(data);
    const text = parsed.content?.[0]?.text || "";
    const i = parsed.usage?.input_tokens || 0;
    const o = parsed.usage?.output_tokens || 0;
    const rates = { "claude-haiku-4-5-20251001": [0.00025, 0.00125], "claude-sonnet-4-6": [0.003, 0.015], "claude-opus-4-8": [0.015, 0.075] };
    const [ir, or] = rates[agent.model] || [0.003, 0.015];
    const cost = (i / 1000) * ir + (o / 1000) * or;
    spendData.runs.push({ date: new Date().toISOString(), role, model: agent.model, input_tokens: i, output_tokens: o, cost_usd: cost });
    fs.writeFileSync(spendPath, JSON.stringify(spendData, null, 2));
    fs.writeFileSync(path.join(outDir, `${role}-${today}.txt`), text);
    console.log(`[${agent.title}] $${cost.toFixed(4)} → output/${role}-${today}.txt`);
  });
});
req.on("error", e => { console.error(e); process.exit(1); });
req.write(body);
req.end();
