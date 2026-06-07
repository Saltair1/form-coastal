#!/usr/bin/env node
/**
 * build-dashboard.js — generates dashboard.html from live data files
 * Run after the daily team run. Commit the SOURCE (this script), not dashboard.html.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}

function readText(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

const economics = readJSON(path.join(root, "data/economics.json")) || {};
const spend = readJSON(path.join(root, "data/spend.json")) || { runs: [], monthly_cap_usd: 20 };
const leads = readJSON(path.join(root, `output/leads-${today}.json`)) || [];
const audit = readJSON(path.join(root, `output/auditor-${today}.txt`));
const copy = readText(path.join(root, `output/writer-${today}.txt`)) || "No copy drafted today.";
const directorOut = readText(path.join(root, `output/director-${today}.txt`)) || "";

const now = new Date();
const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const monthSpend = spend.runs
  .filter((r) => r.date && r.date.startsWith(thisMonth))
  .reduce((sum, r) => sum + (r.cost_usd || 0), 0);

const spendPct = Math.min(100, (monthSpend / spend.monthly_cap_usd) * 100).toFixed(0);
const spendColor = spendPct > 80 ? "#e74c3c" : spendPct > 50 ? "#f39c12" : "#27ae60";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Form Coastal — Command Center</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0f1a; color: #e8edf5; min-height: 100vh; }
  header { background: linear-gradient(135deg, #0d2137 0%, #1a3a5c 100%); padding: 20px 24px; border-bottom: 1px solid #1e3a5f; }
  header h1 { font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #7eb8e8; text-transform: uppercase; }
  header p { font-size: 12px; color: #5a8ab0; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; padding: 20px 24px; max-width: 1200px; }
  .card { background: #0f1e30; border: 1px solid #1e3a5f; border-radius: 12px; padding: 20px; }
  .card h2 { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #5a8ab0; margin-bottom: 14px; }
  .stat { font-size: 32px; font-weight: 700; color: #7eb8e8; }
  .stat-label { font-size: 12px; color: #5a8ab0; margin-top: 4px; }
  .progress-bar { background: #1e3a5f; border-radius: 4px; height: 8px; margin-top: 10px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin: 2px; }
  .pill-green { background: #0d3a1f; color: #27ae60; border: 1px solid #27ae60; }
  .pill-yellow { background: #3a2d00; color: #f39c12; border: 1px solid #f39c12; }
  .pill-red { background: #3a0d0d; color: #e74c3c; border: 1px solid #e74c3c; }
  .priority-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #1e3a5f; }
  .priority-item:last-child { border-bottom: none; }
  .priority-label { font-size: 11px; font-weight: 700; color: #7eb8e8; min-width: 28px; }
  .priority-text { font-size: 13px; color: #b0c8e0; line-height: 1.4; }
  .copy-block { font-size: 12px; color: #b0c8e0; line-height: 1.6; white-space: pre-wrap; max-height: 220px; overflow-y: auto; background: #07111d; border-radius: 8px; padding: 12px; }
  .leads-list { list-style: none; }
  .leads-list li { padding: 8px 0; border-bottom: 1px solid #1e3a5f; font-size: 12px; color: #b0c8e0; }
  .leads-list li:last-child { border-bottom: none; }
  .run-row { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid #1e3a5f; color: #b0c8e0; }
  .run-row:last-child { border-bottom: none; }
  .updated { font-size: 11px; color: #3a5a7a; text-align: right; padding: 8px 24px 16px; }
</style>
</head>
<body>
<header>
  <h1>Form Coastal</h1>
  <p>Command Center · ${today}</p>
</header>
<div class="grid">

  <!-- Priorities -->
  <div class="card">
    <h2>Priorities</h2>
    <div class="priority-item"><span class="priority-label">G1</span><span class="priority-text">Get first inventory order placed and Amazon listing live</span></div>
    <div class="priority-item"><span class="priority-label">G2</span><span class="priority-text">Build TikTok organic audience @formcoastal</span></div>
    <div class="priority-item"><span class="priority-label">G3</span><span class="priority-text">Hit 25 Amazon reviews → unlock $37.99 price</span></div>
  </div>

  <!-- Unit Economics -->
  <div class="card">
    <h2>Unit Economics</h2>
    <div style="display:flex;gap:20px;flex-wrap:wrap;">
      <div><div class="stat">$${economics.launch_price_usd || "—"}</div><div class="stat-label">Launch price</div></div>
      <div><div class="stat">$${economics.post_review_price_usd || "—"}</div><div class="stat-label">Post-review price</div></div>
      <div><div class="stat">${economics.target_margin_pct || "—"}%</div><div class="stat-label">Target margin</div></div>
    </div>
    <div style="margin-top:14px;font-size:12px;color:#5a8ab0;">COGS target: &lt;$${economics.cogs_target_usd} · Amazon fee: ~$${economics.amazon_fee_estimate_usd}</div>
  </div>

  <!-- AI Team Spend -->
  <div class="card">
    <h2>AI Team Spend — ${thisMonth}</h2>
    <div class="stat" style="color:${spendColor}">$${monthSpend.toFixed(3)}</div>
    <div class="stat-label">of $${spend.monthly_cap_usd} cap (${spendPct}%)</div>
    <div class="progress-bar"><div class="progress-fill" style="width:${spendPct}%;background:${spendColor}"></div></div>
    <div style="margin-top:14px;">
      ${spend.runs.slice(-5).reverse().map(r => `<div class="run-row"><span>${r.role}</span><span>${r.model?.split("-")[1] || ""}</span><span>$${(r.cost_usd||0).toFixed(4)}</span></div>`).join("")}
    </div>
  </div>

  <!-- Today's Copy -->
  <div class="card" style="grid-column: span 2;">
    <h2>Today's Copy Drafts</h2>
    <div class="copy-block">${copy.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
  </div>

  <!-- Leads -->
  <div class="card">
    <h2>Today's Leads (${leads.length})</h2>
    ${leads.length ? `<ul class="leads-list">${leads.slice(0,8).map(l => `<li><strong>${l.name || l.business_name || "—"}</strong> · ${l.location || ""}</li>`).join("")}</ul>` : '<div style="font-size:13px;color:#3a5a7a;">No leads generated yet today.</div>'}
  </div>

  <!-- Director output -->
  <div class="card">
    <h2>Director Task Assignments</h2>
    <div class="copy-block">${directorOut.replace(/</g,"&lt;").replace(/>/g,"&gt;") || "No assignments yet today."}</div>
  </div>

</div>
<div class="updated">Last built: ${new Date().toISOString()}</div>
</body>
</html>`;

fs.writeFileSync(path.join(root, "dashboard.html"), html);
console.log("dashboard.html built.");
