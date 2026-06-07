#!/usr/bin/env node
/**
 * run-agent.js  —  executes a single Form Coastal agent role
 * Usage: node scripts/run-agent.js <role>
 * Roles: director | scout | writer | finance | auditor
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

function readText(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

const role = process.argv[2];
if (!role) {
  console.error("Usage: node run-agent.js <role>");
  process.exit(1);
}

const roles = JSON.parse(fs.readFileSync(path.join(__dirname, "../roles.json"), "utf8"));
const agent = roles[role];
if (!agent) {
  console.error(`Unknown role: ${role}. Valid: ${Object.keys(roles).join(", ")}`);
  process.exit(1);
}

const claudeMd = fs.readFileSync(path.join(__dirname, "../CLAUDE.md"), "utf8");
const economics = fs.readFileSync(path.join(__dirname, "../data/economics.json"), "utf8");
const spendData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/spend.json"), "utf8"));

// Check spend cap before running (skip for finance itself)
if (role !== "finance") {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthSpend = spendData.runs
    .filter((r) => r.date && r.date.startsWith(thisMonth))
    .reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  if (monthSpend >= spendData.monthly_cap_usd) {
    const msg = `TEAM PAUSED: monthly spend $${monthSpend.toFixed(2)} >= cap $${spendData.monthly_cap_usd}. Adam must reset data/spend.json to resume.`;
    fs.writeFileSync(path.join(__dirname, "../output/TEAM_PAUSED.txt"), msg);
    console.error(msg);
    process.exit(1);
  }
}

const today = new Date().toISOString().slice(0, 10);

// Build context-aware user prompt per role
const prompts = {
  director: `Today is ${today}. You are the Director for Form Coastal. Read the CLAUDE.md and current priorities below, then output a JSON task assignment for each worker (scout, writer, finance, auditor) for today's run. Each task should be specific and actionable toward G1 > G2 > G3. Output ONLY valid JSON: { "scout": "task...", "writer": "task...", "finance": "task...", "auditor": "task..." }`,
  scout: `Today is ${today}. You are the Lead Scout for Form Coastal. Research and identify 5 high-fit B2B prospects (gyms, surf shops, outdoor retailers, sports medicine practices) that would carry or promote a men's outdoor lifestyle supplement. For each, provide: business name, location, why they're a fit, and any publicly verifiable contact info. NEVER invent emails. Output as JSON array to be saved as output/leads-${today}.json.`,
  writer: `Today is ${today}. You are the Copywriter for Form Coastal. Draft the following for today: (1) one TikTok script (30-45 sec, hook + value + CTA, coastal/active tone), (2) one cold outreach email template for B2B gym partnerships (subject + body, human sends). Brand voice: coastal, clean, confident — not bro-y, not clinical. No health claims. Output as markdown.`,
  finance: `Today is ${today}. Review data/spend.json and summarize current month's API spend. Current data: ${JSON.stringify(spendData)}. Economics: ${economics}. If spend is within cap, output a brief status. If at or over cap, output a PAUSE directive. Format as JSON: { "month_spend_usd": X, "cap_usd": 20, "status": "ok|paused", "note": "..." }`,
  auditor: `Today is ${today}. You are the Auditor for Form Coastal. Review the outputs below for: accuracy (no invented facts), brand voice (coastal/clean/confident), no banned health claims, no invented contacts, CAN-SPAM compliance. Output JSON only: { "passed": true/false, "items_reviewed": [...], "flags": [...] }

--- DIRECTOR OUTPUT ---
${readText(path.join(__dirname, `../output/director-${today}.txt`)) || "none"}

--- SCOUT OUTPUT ---
${readText(path.join(__dirname, `../output/scout-${today}.txt`)) || "none"}

--- WRITER OUTPUT ---
${readText(path.join(__dirname, `../output/writer-${today}.txt`)) || "none"}`,
};

const userPrompt = prompts[role];
const systemPrompt = `${agent.system}\n\n--- CLAUDE.md ---\n${claudeMd}\n\n--- Unit Economics ---\n${economics}`;

const body = JSON.stringify({
  model: agent.model,
  max_tokens: 2048,
  system: systemPrompt,
  messages: [{ role: "user", content: userPrompt }],
});

const options = {
  hostname: "api.anthropic.com",
  path: "/v1/messages",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
};

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    if (res.statusCode !== 200) {
      console.error(`API error ${res.statusCode}: ${data}`);
      process.exit(1);
    }
    const response = JSON.parse(data);
    const text = response.content?.[0]?.text || "";
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    // Rough cost estimate (Haiku ~$0.00025/1K input, $0.00125/1K output; Sonnet ~$0.003/$0.015; Opus ~$0.015/$0.075)
    const costs = {
      "claude-haiku-4-5-20251001": [0.00025, 0.00125],
      "claude-sonnet-4-6": [0.003, 0.015],
      "claude-opus-4-8": [0.015, 0.075],
    };
    const [inRate, outRate] = costs[agent.model] || [0.003, 0.015];
    const costUsd = (inputTokens / 1000) * inRate + (outputTokens / 1000) * outRate;

    // Log spend
    spendData.runs.push({ date: new Date().toISOString(), role, model: agent.model, input_tokens: inputTokens, output_tokens: outputTokens, cost_usd: costUsd });
    fs.writeFileSync(path.join(__dirname, "../data/spend.json"), JSON.stringify(spendData, null, 2));

    // Save output
    const outDir = path.join(__dirname, "../output");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    const outFile = path.join(outDir, `${role}-${today}.txt`);
    fs.writeFileSync(outFile, text);

    console.log(`[${agent.title}] done — $${costUsd.toFixed(4)} — saved to output/${role}-${today}.txt`);
    console.log(text);
  });
});

req.on("error", (e) => { console.error(e); process.exit(1); });
req.write(body);
req.end();
