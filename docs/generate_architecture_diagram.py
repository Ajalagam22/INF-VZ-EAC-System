"""
Generate a professional cloud architecture diagram for the EAC system.
Outputs: docs/EAC_Architecture_Diagram.png  (200 dpi)
         docs/EAC_Architecture_Diagram.pdf
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from pathlib import Path

OUT_DIR = Path(__file__).parent

C = {
    "bg":          "#0d1117",
    "panel":       "#161b22",
    "border":      "#30363d",
    "blue":        "#1f6feb",
    "blue_light":  "#388bfd",
    "green":       "#238636",
    "green_light": "#2ea043",
    "orange":      "#d29922",
    "purple":      "#8957e5",
    "red":         "#da3633",
    "teal":        "#0d7488",
    "white":       "#e6edf3",
    "gray":        "#8b949e",
    "label_bg":    "#21262d",
}

FIG_W, FIG_H = 24, 16
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_facecolor(C["bg"])
fig.patch.set_facecolor(C["bg"])
ax.set_xlim(0, FIG_W)
ax.set_ylim(0, FIG_H)
ax.axis("off")


def box(x, y, w, h, color, alpha=1.0, radius=0.22, lw=1.2, edge=None):
    edge = edge or color
    p = FancyBboxPatch((x, y), w, h,
                       boxstyle=f"round,pad=0,rounding_size={radius}",
                       linewidth=lw, edgecolor=edge,
                       facecolor=color, alpha=alpha, zorder=2)
    ax.add_patch(p)


def txt(x, y, text, size=8.5, color=C["white"], weight="normal",
        ha="center", va="center", zorder=5):
    ax.text(x, y, text, fontsize=size, color=color, fontweight=weight,
            ha=ha, va=va, zorder=zorder, fontfamily="sans-serif",
            clip_on=False)


def zone_header(x, y, w, text, color):
    box(x, y, w, 0.52, color=color, alpha=0.92, radius=0.18, lw=0)
    txt(x + w / 2, y + 0.26, text, size=8.8, weight="bold")


def node(cx, cy, w, h, face, edge, title, sub=""):
    box(cx - w/2, cy - h/2, w, h, color=face, edge=edge, radius=0.18, lw=1.4)
    txt(cx, cy + (0.13 if sub else 0), title, size=8.2, weight="bold")
    if sub:
        txt(cx, cy - 0.22, sub, size=7.0, color=C["gray"])


def arr(x1, y1, x2, y2, color=C["gray"], lw=1.3, head=8):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=color,
                                lw=lw, mutation_scale=head),
                zorder=4)


def dash(x1, y1, x2, y2, color=C["gray"], lw=1.0):
    ax.plot([x1, x2], [y1, y2], color=color, lw=lw, ls="--",
            zorder=3, alpha=0.65)


# ── Title bar ────────────────────────────────────────────────────────────────
box(0, FIG_H - 1.05, FIG_W, 1.05, color="#0d2644", edge=C["blue"], lw=1.8)
txt(FIG_W/2, FIG_H - 0.44,
    "Employee Activity Classification System  —  Cloud Architecture",
    size=17, weight="bold")
txt(FIG_W/2, FIG_H - 0.76,
    "UC-1  Network Annual Capital Labor Survey   |   FastAPI + LangGraph + Azure OpenAI   |   Next.js 14",
    size=9, color=C["gray"])

# ════════════════════════════════════════════════════════════════════════════
# ZONE 1  CLIENT  (x: 0.3 – 3.2)
# ════════════════════════════════════════════════════════════════════════════
Z1x, Z1y, Z1w, Z1h = 0.3, 1.0, 2.9, 13.5
box(Z1x, Z1y, Z1w, Z1h, color="#0a1628", edge=C["blue"], alpha=0.45, lw=1, radius=0.3)
zone_header(Z1x, Z1y + Z1h - 0.52, Z1w, "CLIENT  (Browser / Vercel)", C["blue"])

node(Z1x + Z1w/2, 13.25, 2.4, 0.78, "#0f2340", C["blue_light"],
     "Next.js 14  SPA", "Vercel CDN  |  TypeScript")

pages = [
    ("Dashboard", "CapEx/OpEx KPIs"),
    ("Activity Records", "148 rows + evidence"),
    ("Review Queue", "Low-confidence overrides"),
    ("Audit Trail", "Agent trace viewer"),
    ("Data Sources", "Upload + validation"),
    ("Analytics", "Capitalisation shift"),
    ("Connector Catalog", "Marketplace"),
]
for i, (pg, sub) in enumerate(pages):
    node(Z1x + Z1w/2, 11.9 - i * 1.25, 2.4, 0.78,
         C["label_bg"], C["border"], pg, sub)

# ════════════════════════════════════════════════════════════════════════════
# ZONE 2  BACKEND  (x: 3.5 – 8.4)
# ════════════════════════════════════════════════════════════════════════════
Z2x, Z2y, Z2w, Z2h = 3.5, 1.0, 4.9, 13.5
box(Z2x, Z2y, Z2w, Z2h, color="#0a1e18", edge=C["green"], alpha=0.4, lw=1, radius=0.3)
zone_header(Z2x, Z2y + Z2h - 0.52, Z2w, "BACKEND  (FastAPI · Python 3.12 · Railway / Render)", C["green"])

node(Z2x + Z2w/2, 13.25, 4.3, 0.78, "#0a2e1a", C["green_light"],
     "FastAPI Router", "CORS  |  /upload  /jobs  /records  /audit  /connectors")

node(Z2x + 1.25, 11.9, 2.0, 0.78, C["label_bg"], C["orange"],
     "Ingestion API", "POST /upload/excel|docx")
node(Z2x + 3.5, 11.9, 2.0, 0.78, C["label_bg"], C["orange"],
     "Job Queue", "IngestionJob  |  bg thread")

node(Z2x + Z2w/2, 10.7, 4.3, 0.78, "#1a1a0a", C["orange"],
     "Flow Orchestrator", "asyncio.run()  |  chunk(100)  |  Semaphore(20)")

node(Z2x + 1.25, 9.45, 2.0, 0.78, C["label_bg"], C["teal"],
     "Excel Connector", "openpyxl  |  148 rows")
node(Z2x + 3.5, 9.45, 2.0, 0.78, C["label_bg"], C["teal"],
     "DOCX Connector", "python-docx  |  10 x 39 fields")

# LangGraph pipeline box
box(Z2x + 0.2, 6.25, Z2w - 0.4, 2.8, color="#0a1826", edge=C["blue"], alpha=0.65, lw=1.2, radius=0.2)
txt(Z2x + Z2w/2, 8.8, "LangGraph  6-Node Agentic Pipeline", size=8, weight="bold", color=C["blue_light"])

stages = [
    ("Harvest", "record+HR"),
    ("Context", "LLM call"),
    ("Retrieve", "precedents"),
    ("Policy", "GAAP/IAS16"),
    ("Classify", "det. rules"),
    ("Route", "Cap/Op/Rev"),
]
for i, (st, sub) in enumerate(stages):
    px = Z2x + 0.55 + i * 0.73
    node(px, 7.55, 0.62, 1.15, "#0d2340", C["blue_light"], st, sub)
    if i < 5:
        arr(px + 0.31, 7.55, px + 0.42, 7.55, color=C["blue_light"], lw=0.9, head=6)

node(Z2x + Z2w/2, 5.5, 4.3, 0.78, "#18102a", C["purple"],
     "Hybrid Classifier", "Deterministic rules  |  confidence  |  14 signals")

node(Z2x + 1.25, 4.3, 2.0, 0.78, C["label_bg"], C["green"],
     "Records API", "GET /records  |  overrides")
node(Z2x + 3.5, 4.3, 2.0, 0.78, C["label_bg"], C["red"],
     "Review Queue API", "low-confidence routing")

node(Z2x + Z2w/2, 3.1, 4.3, 0.78, "#1a0a0a", C["red"],
     "Audit Service", "append-only event log  |  agent trace  |  content hash")

node(Z2x + Z2w/2, 1.9, 4.3, 0.78, "#1a160a", C["orange"],
     "SQLite  (WAL mode)", "ActivityRecord  |  IngestionJob  |  AuditEvent")

# ════════════════════════════════════════════════════════════════════════════
# ZONE 3  AI / LLM  (x: 8.7 – 13.2)
# ════════════════════════════════════════════════════════════════════════════
Z3x, Z3y, Z3w, Z3h = 8.7, 6.5, 4.4, 8.0
box(Z3x, Z3y, Z3w, Z3h, color="#130d1e", edge=C["purple"], alpha=0.42, lw=1, radius=0.3)
zone_header(Z3x, Z3y + Z3h - 0.52, Z3w, "AI / LLM LAYER  (Azure OpenAI)", C["purple"])

node(Z3x + Z3w/2, 13.25, 3.9, 0.78, "#1e0d3a", C["purple"],
     "Azure OpenAI Endpoint", "inf-vz-openai-poc.openai.azure.com")
node(Z3x + Z3w/2, 12.1, 3.9, 0.78, "#1a0d2e", C["purple"],
     "Model: gpt-4.1-mini", "API ver 2024-12-01-preview")
node(Z3x + Z3w/2, 10.95, 3.9, 0.78, "#1a0d2e", C["blue"],
     "litellm  acompletion", "async  |  per-record combined call")
node(Z3x + Z3w/2, 9.8, 3.9, 0.78, "#0d1e2e", C["blue"],
     "Single Combined Prompt", "signals + policy + precedents + evidence")
node(Z3x + Z3w/2, 8.65, 3.9, 0.78, "#0d1e2e", C["teal"],
     "LLM Skip Threshold", "conf >= threshold  =>  stub  (~70% skip)")
node(Z3x + Z3w/2, 7.5, 3.9, 0.78, "#0d2e1a", C["green"],
     "Stub Fallback", "deterministic signals  |  no API key required")

# ════════════════════════════════════════════════════════════════════════════
# ZONE 4  RULES & POLICY  (x: 13.5 – 17.8)
# ════════════════════════════════════════════════════════════════════════════
Z4x, Z4y, Z4w, Z4h = 13.5, 9.5, 4.3, 5.0
box(Z4x, Z4y, Z4w, Z4h, color="#0a1e1a", edge=C["teal"], alpha=0.42, lw=1, radius=0.3)
zone_header(Z4x, Z4y + Z4h - 0.52, Z4w, "RULES & POLICY ENGINE", C["teal"])

node(Z4x + Z4w/2, 13.25, 3.8, 0.78, C["label_bg"], C["teal"],
     "Accounting Rules Engine", "GAAP  |  IAS 16  |  fixed-asset-policy-v1.0")
node(Z4x + Z4w/2, 12.1, 3.8, 0.78, C["label_bg"], C["teal"],
     "Signal Ledger", "14 weighted signals  |  CapEx / OpEx indicators")
node(Z4x + Z4w/2, 10.95, 3.8, 0.78, C["label_bg"], C["teal"],
     "Confidence Scorer", "score => pct  |  review threshold = 68")

# ════════════════════════════════════════════════════════════════════════════
# ZONE 5  DATA SOURCES  (x: 13.5 – 17.8)
# ════════════════════════════════════════════════════════════════════════════
Z5x, Z5y, Z5w, Z5h = 13.5, 1.0, 4.3, 8.0
box(Z5x, Z5y, Z5w, Z5h, color="#1a110a", edge=C["orange"], alpha=0.42, lw=1, radius=0.3)
zone_header(Z5x, Z5y + Z5h - 0.52, Z5w, "DATA SOURCES  (Connector Framework)", C["orange"])

data_src = [
    ("Excel Workbook", "148 activity records  |  active", C["green"]),
    ("DOCX Forms ZIP", "10 forms x 39 fields  |  active", C["blue_light"]),
    ("HR Profile", "job title / family / cost centre", C["teal"]),
    ("Project Signals", "milestones / drive tests / asset life", C["teal"]),
    ("SharePoint", "document connector  (future stub)", C["border"]),
    ("BigQuery / ERP", "investment / funding data  (future stub)", C["border"]),
    ("pgvector Store", "semantic precedent retrieval  (future stub)", C["border"]),
]
for i, (title, sub, edge) in enumerate(data_src):
    node(Z5x + Z5w/2, 8.2 - i * 1.03, 3.8, 0.78,
         C["label_bg"] if edge != C["border"] else "#161b22",
         edge, title, sub)

# ════════════════════════════════════════════════════════════════════════════
# ZONE 6  PRODUCTION INFRA  (x: 18.1 – 23.7)
# ════════════════════════════════════════════════════════════════════════════
Z6x, Z6y, Z6w, Z6h = 18.1, 1.0, 5.6, 13.5
box(Z6x, Z6y, Z6w, Z6h, color="#0a0f1a", edge=C["gray"], alpha=0.38, lw=1, radius=0.3)
zone_header(Z6x, Z6y + Z6h - 0.52, Z6w, "PRODUCTION INFRASTRUCTURE  (target state)", C["gray"])

prod = [
    ("Vercel CDN", "Next.js frontend  |  global edge", C["blue"]),
    ("Railway / Render", "FastAPI container  |  uvicorn", C["green"]),
    ("Azure OpenAI", "LLM API  |  gpt-4.1-mini", C["purple"]),
    ("S3 / GCS Blob", "file staging  |  replaces local disk", C["orange"]),
    ("PostgreSQL", "prod DB  |  replaces SQLite", C["teal"]),
    ("pgvector", "semantic precedent store", C["teal"]),
    ("Redis", "job queue  |  replaces bg thread", C["red"]),
    ("HRIS / SAP", "live HR profile data  |  future", C["gray"]),
    ("WORM Audit Archive", "immutable event store  |  compliance", C["orange"]),
    ("RBAC / SSO", "role-based access control", C["blue"]),
]
for i, (title, sub, edge) in enumerate(prod):
    node(Z6x + Z6w/2, 13.0 - i * 1.32, 4.9, 0.9,
         C["label_bg"], edge, title, sub)

# ════════════════════════════════════════════════════════════════════════════
# ARROWS
# ════════════════════════════════════════════════════════════════════════════

# Browser <-> FastAPI
arr(Z1x + Z1w, 13.25, Z2x, 13.25, color=C["blue_light"], lw=1.6, head=10)
arr(Z2x, 12.95, Z1x + Z1w, 12.95, color=C["green_light"], lw=1.3, head=8)

# FastAPI -> Ingestion
arr(Z2x + 1.25, 12.86, Z2x + 1.25, 12.29, color=C["orange"], lw=1.2)
arr(Z2x + 3.5, 12.86, Z2x + 3.5, 12.29, color=C["orange"], lw=1.2)

# Job Queue -> Orchestrator
arr(Z2x + Z2w/2, 11.51, Z2x + Z2w/2, 11.09, color=C["orange"], lw=1.3)

# Orchestrator -> Connectors
arr(Z2x + 1.25, 10.31, Z2x + 1.25, 9.84, color=C["teal"], lw=1.2)
arr(Z2x + 3.5, 10.31, Z2x + 3.5, 9.84, color=C["teal"], lw=1.2)

# Connectors -> Pipeline
arr(Z2x + 1.25, 9.06, Z2x + 1.25, 9.05 - 0.08, color=C["blue"], lw=1.2)
arr(Z2x + 3.5, 9.06, Z2x + 3.5, 9.05 - 0.08, color=C["blue"], lw=1.2)

# Pipeline -> Classifier
arr(Z2x + Z2w/2, 6.25, Z2x + Z2w/2, 5.89, color=C["purple"], lw=1.4)

# Classifier -> Records / Review
arr(Z2x + 1.25, 5.11, Z2x + 1.25, 4.69, color=C["green"], lw=1.2)
arr(Z2x + 3.5, 5.11, Z2x + 3.5, 4.69, color=C["red"], lw=1.2)

# -> Audit
arr(Z2x + 1.25, 3.91, Z2x + 1.25, 3.49, color=C["red"], lw=1.1)
arr(Z2x + 3.5, 3.91, Z2x + 3.5, 3.49, color=C["red"], lw=1.1)

# Audit -> SQLite
arr(Z2x + Z2w/2, 2.71, Z2x + Z2w/2, 2.29, color=C["orange"], lw=1.3)

# Orchestrator <-> LLM layer
arr(Z2x + Z2w, 10.7, Z3x, 10.95, color=C["purple"], lw=1.6, head=10)
arr(Z3x, 10.65, Z2x + Z2w, 10.4, color=C["purple"], lw=1.2, head=8)

# LLM layer internal
arr(Z3x + Z3w/2, 13.25 - 0.39, Z3x + Z3w/2, 12.1 + 0.39, color=C["purple"], lw=1.2)
arr(Z3x + Z3w/2, 12.1 - 0.39, Z3x + Z3w/2, 10.95 + 0.39, color=C["purple"], lw=1.2)

# Rules & Policy -> Pipeline (dashed — consulted during policy node)
dash(Z4x, 11.5, Z2x + Z2w + 0.1, 8.0, color=C["teal"], lw=1.1)

# Data Sources -> Connectors
arr(Z5x, 7.5, Z2x + Z2w + 0.1, 9.45, color=C["orange"], lw=1.4, head=9)

# Backend -> Prod infra (deployment, dashed)
dash(Z2x + Z2w, 13.0, Z6x, 13.0, color=C["green"], lw=1.0)
dash(Z2x + Z2w, 1.9, Z6x, 3.8, color=C["orange"], lw=0.9)

# ════════════════════════════════════════════════════════════════════════════
# Legend
# ════════════════════════════════════════════════════════════════════════════
leg_items = [
    (C["blue_light"], "HTTP request/response"),
    (C["purple"],     "LLM API call (async)"),
    (C["teal"],       "rule / policy evaluation"),
    (C["orange"],     "data pipeline flow"),
    (C["green"],      "classification output"),
    (C["gray"],       "deployment / future (dashed)"),
]
for idx, (clr, lbl) in enumerate(leg_items):
    lx = 0.4 + idx * 3.8
    ax.plot([lx, lx + 0.6], [0.38, 0.38], color=clr, lw=2.2, zorder=5)
    txt(lx + 0.75, 0.38, lbl, size=7.8, color=C["gray"], ha="left")

# ════════════════════════════════════════════════════════════════════════════
# Save
# ════════════════════════════════════════════════════════════════════════════
for ext in ("png", "pdf"):
    out = OUT_DIR / f"EAC_Architecture_Diagram.{ext}"
    fig.savefig(out, dpi=200 if ext == "png" else 150,
                bbox_inches="tight", facecolor=C["bg"])
    print(f"Saved: {out}")

plt.close(fig)
