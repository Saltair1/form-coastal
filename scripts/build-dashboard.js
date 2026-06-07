#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);
const month = today.slice(0, 7);

function read(p) { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } }
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } }
function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function fmt(s) {
  if (!s) return '<span style="color:var(--dim)">No output yet.</span>';
  return esc(s)
    .replace(/^## (.+)$/gm, '<div class="out-h2">$1</div>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:10px 0">')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
    .replace(/\n/g, '<br>');
}

const economics = readJSON(path.join(root, "data/economics.json")) || {};
const spend = readJSON(path.join(root, "data/spend.json")) || { runs: [], monthly_cap_usd: 20 };
const status = readJSON(path.join(root, "data/status.json")) || {};

const directorOut = read(path.join(root, `output/director-${today}.txt`));
const writerOut   = read(path.join(root, `output/writer-${today}.txt`));
const scoutOut    = read(path.join(root, `output/scout-${today}.txt`));
const financeOut  = read(path.join(root, `output/finance-${today}.txt`));
const auditorOut  = read(path.join(root, `output/auditor-${today}.txt`));

const monthSpend = spend.runs.filter(r => r.date?.startsWith(month)).reduce((s, r) => s + (r.cost_usd || 0), 0);
const spendPct = Math.min(100, (monthSpend / spend.monthly_cap_usd) * 100).toFixed(0);
const spendColor = spendPct > 80 ? "#e74c3c" : spendPct > 50 ? "#f39c12" : "#2ecc71";

let auditPassed = null;
try { const m = auditorOut.match(/\{[\s\S]*\}/); if (m) auditPassed = JSON.parse(m[0]).passed; } catch {}
const auditBadge = auditPassed === true ? `<span class="pill green">✓ Audit Passed</span>` : auditPassed === false ? `<span class="pill red">✗ Audit Failed</span>` : `<span class="pill yellow">Audit Pending</span>`;

const milestones = status.milestones || [];
const manufacturers = status.manufacturers || [];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Form Coastal</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #070d18;
  --surface: #0d1c2e;
  --surface2: #050e1a;
  --border: #1a3050;
  --blue: #5fa8d3;
  --dim: #3a6080;
  --text: #d0dce8;
  --green: #2ecc71;
  --yellow: #f39c12;
  --red: #e74c3c;
}
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
header { padding: 24px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.logo { font-size: 18px; font-weight: 700; letter-spacing: 3px; color: var(--blue); text-transform: uppercase; }
.header-right { font-size: 12px; color: var(--dim); }
.page { max-width: 1100px; margin: 0 auto; padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }
.section-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); margin-bottom: 12px; }
.goals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
@media (max-width: 700px) { .goals { grid-template-columns: 1fr; } }
.goal { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px 18px; display: flex; gap: 12px; }
.goal-g { font-size: 11px; font-weight: 800; background: var(--blue); color: var(--bg); border-radius: 5px; padding: 2px 7px; height: fit-content; margin-top: 1px; flex-shrink: 0; }
.goal-text { font-size: 13px; color: var(--text); line-height: 1.5; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; }
.stat-num { font-size: 26px; font-weight: 700; color: var(--blue); }
.stat-lbl { font-size: 11px; color: var(--dim); margin-top: 4px; }
.prog { background: var(--border); border-radius: 3px; height: 5px; margin-top: 8px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 3px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
.card-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); margin-bottom: 14px; }
.output { font-size: 12px; color: var(--text); line-height: 1.8; max-height: 280px; overflow-y: auto; background: var(--surface2); border-radius: 8px; padding: 14px; font-family: inherit; }
  .out-h2 { font-size: 12px; font-weight: 700; color: var(--blue); letter-spacing: 0.5px; margin: 10px 0 6px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 700px) { .two { grid-template-columns: 1fr; } }
.milestones { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.ms { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; display: flex; gap: 10px; align-items: flex-start; }
.ms-text { font-size: 12px; line-height: 1.4; }
.done { color: var(--dim); text-decoration: line-through; }
.pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.pill.green { background: #0a2e18; color: var(--green); border: 1px solid var(--green); }
.pill.yellow { background: #2e2000; color: var(--yellow); border: 1px solid var(--yellow); }
.pill.red { background: #2e0a0a; color: var(--red); border: 1px solid var(--red); }
.footer { text-align: center; font-size: 11px; color: var(--dim); padding: 24px; }
</style>
</head>
<body>
<header>
  <div>
    <div class="logo">Form Coastal</div>
    <div style="font-size:11px;color:var(--dim);margin-top:3px">Salt Air Industries LLC · Command Center</div>
  </div>
  <div class="header-right">${today} &nbsp;·&nbsp; ${auditBadge}</div>
</header>

<div class="page">

  <div>
    <div class="section-label">Company Goals</div>
    <div class="goals">
      <div class="goal"><div class="goal-g">G1</div><div class="goal-text">Get first inventory order placed and <strong>Amazon listing live</strong></div></div>
      <div class="goal"><div class="goal-g">G2</div><div class="goal-text">Build TikTok organic audience <strong>@formcoastal</strong> to drive awareness</div></div>
      <div class="goal"><div class="goal-g">G3</div><div class="goal-text">Hit <strong>25 Amazon reviews</strong> to unlock $37.99 price</div></div>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-num">$${economics.launch_price_usd || "—"}</div>
      <div class="stat-lbl">Launch price</div>
    </div>
    <div class="stat">
      <div class="stat-num">$${economics.post_review_price_usd || "—"}</div>
      <div class="stat-lbl">Post-review price</div>
    </div>
    <div class="stat">
      <div class="stat-num" style="color:${spendColor}">$${monthSpend.toFixed(2)}</div>
      <div class="stat-lbl">AI spend this month (cap $${spend.monthly_cap_usd})</div>
      <div class="prog"><div class="prog-fill" style="width:${spendPct}%;background:${spendColor}"></div></div>
    </div>
  </div>

  <div>
    <div class="section-label">Today's Agent Outputs</div>
    <div class="two">
      <div class="card">
        <div class="card-label">🎯 Director</div>
        <div class="output">${fmt(directorOut)}</div>
      </div>
      <div class="card">
        <div class="card-label">✍️ Writer</div>
        <div class="output">${fmt(writerOut)}</div>
      </div>
      <div class="card">
        <div class="card-label">🔍 Scout</div>
        <div class="output">${fmt(scoutOut)}</div>
      </div>
      <div class="card">
        <div class="card-label">💰 Finance</div>
        <div class="output">${fmt(financeOut)}</div>
      </div>
      <div class="card">
        <div class="card-label">🔎 Auditor</div>
        <div class="output">${fmt(auditorOut)}</div>
      </div>
    </div>
  </div>

  <div>
    <div class="section-label">Launch Milestones</div>
    <div class="milestones">
      ${milestones.map(m => `
        <div class="ms">
          <span style="flex-shrink:0">${m.status === "done" ? "✅" : "⬜"}</span>
          <span class="ms-text ${m.status === "done" ? "done" : ""}">${esc(m.task)}</span>
        </div>`).join("")}
    </div>
  </div>

  ${manufacturers.length ? `
  <div>
    <div class="section-label">Suppliers</div>
    <div class="two">
      ${manufacturers.map(m => `
        <div class="card">
          <div class="card-label">${esc(m.name)}</div>
          <div style="font-size:12px;color:var(--dim);line-height:1.8">
            Status: <span style="color:${m.status === "quote_received" ? "var(--green)" : "var(--yellow)"};">${esc(m.status.replace(/_/g," "))}</span><br>
            ${m.email ? `Email: ${esc(m.email)}<br>` : ""}${m.phone ? `Phone: ${esc(m.phone)}<br>` : ""}${m.website ? `Web: ${esc(m.website)}<br>` : ""}
          </div>
          <div style="font-size:12px;color:var(--text);margin-top:10px">${esc(m.notes)}</div>
        </div>`).join("")}
    </div>
  </div>` : ""}

</div>
<div class="footer">Last built: ${new Date().toISOString()} · saltair1.github.io/form-coastal</div>
</body>
</html>`;

fs.writeFileSync(path.join(root, "index.html"), html);
console.log("index.html built.");
