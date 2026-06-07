#!/usr/bin/env node
/**
 * build-dashboard.js — generates dashboard.html from live data files
 * Commit this SOURCE file, not dashboard.html.
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
function esc(s) {
  return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

const economics = readJSON(path.join(root, "data/economics.json")) || {};
const spend = readJSON(path.join(root, "data/spend.json")) || { runs: [], monthly_cap_usd: 20 };
const copy = readText(path.join(root, `output/writer-${today}.txt`)) || "No copy drafted today.";
const directorRaw = readText(path.join(root, `output/director-${today}.txt`)) || "";
const scoutRaw = readText(path.join(root, `output/scout-${today}.txt`)) || "";
const auditorRaw = readText(path.join(root, `output/auditor-${today}.txt`)) || "";
const financeRaw = readText(path.join(root, `output/finance-${today}.txt`)) || "";

// Parse director JSON task assignments if possible
let tasks = null;
try {
  const jsonMatch = directorRaw.match(/\{[\s\S]*\}/);
  if (jsonMatch) tasks = JSON.parse(jsonMatch[0]);
} catch {}

// Parse leads array if possible
let leads = [];
try {
  const jsonMatch = scoutRaw.match(/\[[\s\S]*\]/);
  if (jsonMatch) leads = JSON.parse(jsonMatch[0]);
} catch {}

// Parse audit pass/fail
let auditPassed = null;
try {
  const jsonMatch = auditorRaw.match(/\{[\s\S]*\}/);
  if (jsonMatch) { const a = JSON.parse(jsonMatch[0]); auditPassed = a.passed; }
} catch {}

const now = new Date();
const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const monthSpend = spend.runs
  .filter(r => r.date && r.date.startsWith(thisMonth))
  .reduce((sum, r) => sum + (r.cost_usd || 0), 0);
const spendPct = Math.min(100, (monthSpend / spend.monthly_cap_usd) * 100).toFixed(0);
const spendColor = spendPct > 80 ? "#e74c3c" : spendPct > 50 ? "#f39c12" : "#2ecc71";

const auditBadge = auditPassed === true
  ? `<span class="pill pill-green">✓ Audit Passed</span>`
  : auditPassed === false
  ? `<span class="pill pill-red">✗ Audit Failed</span>`
  : `<span class="pill pill-yellow">Audit Pending</span>`;

const taskRoles = ["scout", "writer", "finance", "auditor"];
const taskHTML = tasks
  ? taskRoles.map(r => `
      <div class="todo-item">
        <div class="todo-role">${r.charAt(0).toUpperCase() + r.slice(1)}</div>
        <div class="todo-text">${esc(tasks[r] || "—")}</div>
      </div>`).join("")
  : `<div style="font-size:13px;color:#3a5a7a;">No assignments today yet.</div>`;

const leadsHTML = leads.length
  ? leads.slice(0, 8).map(l => `
      <div class="lead-item">
        <div class="lead-name">${esc(l.name || l.business_name || "—")}</div>
        <div class="lead-meta">${esc(l.location || "")}${l.why ? " · " + esc(l.why) : ""}</div>
      </div>`).join("")
  : `<div style="font-size:13px;color:#3a5a7a;">No leads generated yet today.</div>`;

const recentRuns = spend.runs.slice(-6).reverse();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Form Coastal — Command Center</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #070d18;
    --surface: #0d1c2e;
    --surface2: #071120;
    --border: #1a3050;
    --blue: #5fa8d3;
    --blue-dim: #3a6a8a;
    --text: #d0dce8;
    --text-dim: #4a6a8a;
    --green: #2ecc71;
    --yellow: #f39c12;
    --red: #e74c3c;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  /* Header */
  header { padding: 28px 28px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #1a4a6e, #2e8ab8); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .brand-name { font-size: 20px; font-weight: 700; letter-spacing: 3px; color: var(--blue); text-transform: uppercase; }
  .brand-sub { font-size: 11px; color: var(--text-dim); margin-top: 2px; letter-spacing: 1px; }
  .header-meta { font-size: 12px; color: var(--text-dim); text-align: right; }
  .header-meta strong { color: var(--text); }

  /* Layout */
  .page { max-width: 1200px; padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

  /* Today banner */
  .today-banner { background: linear-gradient(135deg, #0a1e35 0%, #0d2a40 100%); border: 1px solid var(--border); border-radius: 14px; padding: 22px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .today-date { font-size: 13px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1.5px; }
  .today-title { font-size: 22px; font-weight: 700; color: var(--text); margin-top: 4px; }
  .today-badges { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

  /* Goal bars */
  .goals { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
  .goal-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; display: flex; gap: 14px; align-items: flex-start; }
  .goal-badge { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: var(--bg); background: var(--blue); border-radius: 6px; padding: 3px 8px; min-width: 32px; text-align: center; flex-shrink: 0; margin-top: 2px; }
  .goal-text { font-size: 14px; color: var(--text); line-height: 1.4; }

  /* Two col */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 720px) { .two-col { grid-template-columns: 1fr; } }

  /* Cards */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .card-full { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .card-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 16px; }

  /* Today's to-do */
  .todo-item { display: flex; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border); align-items: flex-start; }
  .todo-item:last-child { border-bottom: none; }
  .todo-role { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--blue); min-width: 60px; margin-top: 2px; }
  .todo-text { font-size: 13px; color: var(--text); line-height: 1.5; }

  /* Stats row */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .stat-block { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; }
  .stat-num { font-size: 28px; font-weight: 700; color: var(--blue); }
  .stat-lbl { font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  /* Progress bar */
  .prog-wrap { margin-top: 10px; background: var(--border); border-radius: 4px; height: 6px; overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 4px; }

  /* Copy block */
  .copy-block { font-size: 12px; color: var(--text); line-height: 1.7; white-space: pre-wrap; max-height: 260px; overflow-y: auto; background: var(--surface2); border-radius: 8px; padding: 14px; }

  /* Leads */
  .lead-item { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .lead-item:last-child { border-bottom: none; }
  .lead-name { font-size: 13px; font-weight: 600; color: var(--text); }
  .lead-meta { font-size: 11px; color: var(--text-dim); margin-top: 3px; }

  /* Spend table */
  .spend-row { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid var(--border); color: var(--text); }
  .spend-row:last-child { border-bottom: none; }
  .spend-role { color: var(--blue); font-weight: 600; }

  /* Pills */
  .pill { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .pill-green { background: #0a2e18; color: var(--green); border: 1px solid var(--green); }
  .pill-yellow { background: #2e2000; color: var(--yellow); border: 1px solid var(--yellow); }
  .pill-red { background: #2e0a0a; color: var(--red); border: 1px solid var(--red); }
  .pill-blue { background: #0a1e30; color: var(--blue); border: 1px solid var(--blue-dim); }

  .footer { font-size: 11px; color: var(--text-dim); text-align: center; padding: 16px 0 32px; }
</style>
</head>
<body>

<header>
  <div class="brand">
    <div class="brand-icon">🌊</div>
    <div>
      <div class="brand-name">Form Coastal</div>
      <div class="brand-sub">Command Center</div>
    </div>
  </div>
  <div class="header-meta">
    <strong>${today}</strong><br>
    Salt Air Industries LLC
  </div>
</header>

<div class="page">

  <!-- Today banner -->
  <div class="today-banner">
    <div>
      <div class="today-date">Daily Briefing</div>
      <div class="today-title">What's happening today</div>
    </div>
    <div class="today-badges">
      ${auditBadge}
      <span class="pill pill-blue">AI Team Active</span>
    </div>
  </div>

  <!-- Company Goals -->
  <div>
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px;">Overarching Goals</div>
    <div class="goals">
      <div class="goal-card"><div class="goal-badge">G1</div><div class="goal-text">Get first inventory order placed and <strong>Amazon listing live</strong></div></div>
      <div class="goal-card"><div class="goal-badge">G2</div><div class="goal-text">Build TikTok organic audience <strong>@formcoastal</strong> to drive awareness</div></div>
      <div class="goal-card"><div class="goal-badge">G3</div><div class="goal-text">Hit <strong>25 Amazon reviews</strong> → unlock $37.99 price increase</div></div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-block">
      <div class="stat-num">$${economics.launch_price_usd || "—"}</div>
      <div class="stat-lbl">Launch price</div>
    </div>
    <div class="stat-block">
      <div class="stat-num">$${economics.post_review_price_usd || "—"}</div>
      <div class="stat-lbl">Post-review price</div>
    </div>
    <div class="stat-block">
      <div class="stat-num" style="color:${spendColor}">$${monthSpend.toFixed(2)}</div>
      <div class="stat-lbl">AI spend this month</div>
      <div class="prog-wrap"><div class="prog-fill" style="width:${spendPct}%;background:${spendColor}"></div></div>
    </div>
  </div>

  <!-- Today's To-Do + Copy -->
  <div class="two-col">
    <div class="card">
      <div class="card-label">Today's Agent Tasks</div>
      ${taskHTML}
    </div>
    <div class="card">
      <div class="card-label">Copy Drafts — Ready to Use</div>
      <div class="copy-block">${esc(copy)}</div>
    </div>
  </div>

  <!-- Leads + Spend -->
  <div class="two-col">
    <div class="card">
      <div class="card-label">Today's Leads (${leads.length})</div>
      ${leadsHTML}
    </div>
    <div class="card">
      <div class="card-label">Recent Agent Runs</div>
      ${recentRuns.length
        ? recentRuns.map(r => `
          <div class="spend-row">
            <span class="spend-role">${r.role}</span>
            <span style="color:var(--text-dim)">${r.model?.split("-")[1] || r.model}</span>
            <span>$${(r.cost_usd||0).toFixed(4)}</span>
          </div>`).join("")
        : '<div style="font-size:13px;color:var(--text-dim)">No runs logged yet.</div>'
      }
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:12px;">
        <span style="color:var(--text-dim)">Month total</span>
        <span style="color:${spendColor};font-weight:700">$${monthSpend.toFixed(3)} / $${spend.monthly_cap_usd}</span>
      </div>
    </div>
  </div>

  <!-- Audit full output -->
  <div class="card-full">
    <div class="card-label">Auditor Report</div>
    <div class="copy-block">${esc(auditorRaw) || "No audit report yet."}</div>
  </div>

</div>

<div class="footer">Last built: ${new Date().toISOString()} · saltair1.github.io/form-coastal</div>

</body>
</html>`;

fs.writeFileSync(path.join(root, "dashboard.html"), html);
console.log("dashboard.html built.");
