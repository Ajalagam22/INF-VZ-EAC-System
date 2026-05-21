"""
EAC System — Azure Cloud Architecture Diagram
Saves: docs/EAC_Azure_Architecture.png  (200 dpi)
       docs/EAC_Azure_Architecture.pdf
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from pathlib import Path

OUT = Path(__file__).parent

# ── Palette ──────────────────────────────────────────────────────────────────
BG      = "#0d1117"
PANEL   = "#161b22"
DARKER  = "#0a0d12"
WHITE   = "#e6edf3"
GRAY    = "#8b949e"
AZURE   = "#0078d4"       # Microsoft Azure blue
GREEN   = "#238636"
PURPLE  = "#8957e5"
TEAL    = "#0d7488"
ORANGE  = "#d29922"
RED     = "#da3633"
BL      = "#388bfd"       # lighter blue
GR      = "#2ea043"       # lighter green
VNET    = "#1a2030"       # VNet zone fill

FIG_W, FIG_H = 28, 18
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_facecolor(BG); fig.patch.set_facecolor(BG)
ax.set_xlim(0, FIG_W); ax.set_ylim(0, FIG_H); ax.axis("off")


# ── Helpers ──────────────────────────────────────────────────────────────────
def box(x, y, w, h, face=PANEL, edge=GRAY, lw=1.3, alpha=1.0, r=0.2):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad=0,rounding_size={r}",
        linewidth=lw, edgecolor=edge, facecolor=face, alpha=alpha, zorder=2))

def txt(x, y, s, sz=8.5, c=WHITE, wt="normal", ha="center", va="center", z=5):
    ax.text(x, y, s, fontsize=sz, color=c, fontweight=wt,
            ha=ha, va=va, zorder=z, fontfamily="sans-serif")

def zone(x, y, w, h, face, edge, title):
    box(x, y, w, h, face=face, edge=edge, lw=1.2, alpha=0.40, r=0.3)
    box(x, y+h-0.52, w, 0.52, face=edge, edge=edge, lw=0, alpha=0.92, r=0.2)
    txt(x+w/2, y+h-0.26, title, sz=8.8, wt="bold")

def node(cx, cy, w, h, face=PANEL, edge=GRAY, title="", sub=""):
    box(cx-w/2, cy-h/2, w, h, face=face, edge=edge, lw=1.4)
    txt(cx, cy+(0.13 if sub else 0), title, sz=8.2, wt="bold")
    if sub:
        txt(cx, cy-0.22, sub, sz=7.0, c=GRAY)

def arr(x1, y1, x2, y2, c=GRAY, lw=1.3, head=8):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=c, lw=lw, mutation_scale=head),
                zorder=4)

def dash(x1, y1, x2, y2, c=GRAY, lw=1.0):
    ax.plot([x1,x2],[y1,y2], color=c, lw=lw, ls="--", zorder=3, alpha=0.65)


# ════════════════════════════════════════════════════════════════════════════
# TITLE
# ════════════════════════════════════════════════════════════════════════════
box(0, FIG_H-1.05, FIG_W, 1.05, face="#062147", edge=AZURE, lw=2.0, r=0)
txt(FIG_W/2, FIG_H-0.43,
    "Employee Activity Classification System  —  Azure Cloud Architecture",
    sz=17, wt="bold", c=WHITE)
txt(FIG_W/2, FIG_H-0.76,
    "UC-1  Network Annual Capital Labor Survey   |   Azure Container Apps + PostgreSQL + Azure OpenAI   |   FastAPI + LangGraph + Next.js 14",
    sz=9, c=GRAY)

# ════════════════════════════════════════════════════════════════════════════
# VNET BOUNDARY  (drawn behind zones 3 and 5)
# ════════════════════════════════════════════════════════════════════════════
box(3.3, 0.9, 14.6, 15.7, face=VNET, edge="#2a3f6f", lw=1.5, alpha=0.35, r=0.4)
txt(10.6, 1.15, "Azure Virtual Network  10.0.0.0/16  —  Private Endpoints for all Data Services",
    sz=7.5, c="#4a6fa5")

# ════════════════════════════════════════════════════════════════════════════
# ZONE 1  USERS & CLIENT  (x 0.2 – 3.1)
# ════════════════════════════════════════════════════════════════════════════
Z1x,Z1w = 0.2, 2.9
zone(Z1x, 1.0, Z1w, 15.6, face="#081428", edge=AZURE, title="CLIENT  (Browser / Vercel)")

node(Z1x+Z1w/2, 15.3, 2.4, 0.72, face="#0d2040", edge=BL,
     title="Finance Reviewer", sub="Azure Entra ID (OIDC)")
node(Z1x+Z1w/2, 14.3, 2.4, 0.72, face="#0d2040", edge=BL,
     title="Domain Lead View", sub="Team-scoped RBAC")
node(Z1x+Z1w/2, 13.3, 2.4, 0.78, face="#0f2340", edge=AZURE,
     title="Next.js 14  SPA", sub="Vercel CDN  |  TypeScript")

pages = [
    ("Dashboard","CapEx/OpEx KPIs"),
    ("Activity Records","148 rows + evidence"),
    ("Review Queue","Low-confidence overrides"),
    ("Audit Trail","Agent trace viewer"),
    ("Data Sources","Upload + validation"),
    ("Analytics","Capitalisation shift"),
    ("Connector Catalog","Marketplace"),
]
for i,(pg,sub) in enumerate(pages):
    node(Z1x+Z1w/2, 12.1-i*1.18, 2.4, 0.78, face=PANEL, edge="#30363d", title=pg, sub=sub)

# ════════════════════════════════════════════════════════════════════════════
# ZONE 2  AZURE FRONT DOOR  (x 3.4 – 6.0)
# ════════════════════════════════════════════════════════════════════════════
Z2x,Z2w = 3.4, 2.6
zone(Z2x, 10.5, Z2w, 6.1, face="#1a0e05", edge=ORANGE, title="AZURE FRONT DOOR")

node(Z2x+Z2w/2, 15.7, 2.2, 0.78, face="#2a1a05", edge=ORANGE,
     title="Azure Front Door", sub="Global CDN  |  DDoS protection")
node(Z2x+Z2w/2, 14.6, 2.2, 0.78, face=PANEL, edge=ORANGE,
     title="WAF Policy", sub="OWASP 3.2  |  rate limiting")
node(Z2x+Z2w/2, 13.5, 2.2, 0.78, face=PANEL, edge=ORANGE,
     title="SSL/TLS Termination", sub="HTTPS enforced end-to-end")
node(Z2x+Z2w/2, 12.4, 2.2, 0.78, face=PANEL, edge=ORANGE,
     title="CORS Policy", sub="Vercel origin allowed")
node(Z2x+Z2w/2, 11.3, 2.2, 0.78, face=PANEL, edge=ORANGE,
     title="Health Probes", sub="Liveness + readiness checks")

# ════════════════════════════════════════════════════════════════════════════
# ZONE 3  AZURE CONTAINER APPS  (x 6.2 – 12.8)
# ════════════════════════════════════════════════════════════════════════════
Z3x,Z3w = 6.2, 6.6
zone(Z3x, 1.0, Z3w, 15.6, face="#0a1e10", edge=GREEN,
     title="AZURE CONTAINER APPS ENVIRONMENT  (VNet Integrated  |  Managed Identity)")

# --- eac-api container sub-zone ---
box(Z3x+0.15, 10.0, Z3w-0.3, 6.1, face="#0d2218", edge=GR, lw=1.0, alpha=0.6, r=0.2)
txt(Z3x+Z3w/2, 15.85, "eac-api  Container  (HTTP Ingress  |  min 1, max 10 replicas)",
    sz=7.8, wt="bold", c=GR)

node(Z3x+Z3w/2, 15.2, 5.9, 0.72, face="#0a2e18", edge=GR,
     title="FastAPI Router", sub="CORS  |  auth middleware  |  /upload  /jobs  /records  /audit")
node(Z3x+1.6, 14.0, 2.65, 0.72, face=PANEL, edge=ORANGE,
     title="Ingestion API", sub="POST /upload/excel|docx")
node(Z3x+4.6, 14.0, 2.65, 0.72, face=PANEL, edge=ORANGE,
     title="Job Status API", sub="GET /jobs/{id}  polling")
node(Z3x+1.6, 12.85, 2.65, 0.72, face=PANEL, edge=GR,
     title="Records API", sub="GET /records  |  overrides")
node(Z3x+4.6, 12.85, 2.65, 0.72, face=PANEL, edge=RED,
     title="Review Queue API", sub="low-confidence routing")
node(Z3x+Z3w/2, 11.8, 5.9, 0.72, face="#1a0a10", edge=RED,
     title="Audit Service", sub="append-only event log  |  content hash  |  agent trace")
node(Z3x+Z3w/2, 10.75, 5.9, 0.72, face="#1a1805", edge=ORANGE,
     title="Form Validation Service", sub="field-level comparison  |  match rate  |  10 forms x 39 fields")

# --- LangGraph pipeline sub-zone ---
box(Z3x+0.15, 6.15, Z3w-0.3, 3.6, face="#090f1e", edge=BL, lw=1.0, alpha=0.65, r=0.2)
txt(Z3x+Z3w/2, 9.55, "LangGraph  6-Node Agentic Pipeline  (per-record, deterministic verdict, LLM advisory)",
    sz=7.8, wt="bold", c=BL)

stages = [
    ("Harvest","record+HR"),
    ("Context","LLM call"),
    ("Retrieve","precedents"),
    ("Policy","GAAP/IAS16"),
    ("Classify","det. rules"),
    ("Route","Cap/Op/Rev"),
]
for i,(st,sub) in enumerate(stages):
    px = Z3x+0.62+i*1.03
    node(px, 8.7, 0.92, 1.15, face="#0d2040", edge=BL, title=st, sub=sub)
    if i<5:
        arr(px+0.46, 8.7, px+0.57, 8.7, c=BL, lw=0.9, head=6)

node(Z3x+Z3w/2, 7.45, 5.9, 0.78, face="#1a0e2a", edge=PURPLE,
     title="Hybrid Classifier", sub="Deterministic rules authoritative  |  14 signals  |  confidence  |  LLM advisory")
node(Z3x+Z3w/2, 6.6, 5.9, 0.72, face=PANEL, edge=PURPLE,
     title="Signal Ledger + Confidence Scorer", sub="score -> 0-100 confidence  |  review threshold = 68")

# --- eac-worker container sub-zone ---
box(Z3x+0.15, 1.8, Z3w-0.3, 3.9, face="#0d2018", edge=GREEN, lw=1.0, alpha=0.6, r=0.2)
txt(Z3x+Z3w/2, 5.5, "eac-worker  Container  (Queue-triggered  |  KEDA Azure Service Bus  |  scale 0-20)",
    sz=7.8, wt="bold", c=GR)

node(Z3x+Z3w/2, 4.85, 5.9, 0.72, face="#0a2e10", edge=GR,
     title="Flow Orchestrator", sub="asyncio.run()  |  asyncio.gather()  |  Semaphore(20)  |  chunk(100)")
node(Z3x+1.6, 3.75, 2.65, 0.72, face=PANEL, edge=TEAL,
     title="Excel Connector", sub="openpyxl  |  schema validate  |  quarantine")
node(Z3x+4.6, 3.75, 2.65, 0.72, face=PANEL, edge=TEAL,
     title="DOCX Connector", sub="python-docx  |  regex extract  |  39 fields")
node(Z3x+Z3w/2, 2.65, 5.9, 0.72, face=PANEL, edge=GREEN,
     title="Run Manifest Producer", sub="records processed | classified | escalated | failed | duration")

# ════════════════════════════════════════════════════════════════════════════
# ZONE 4  AZURE AI SERVICES  (x 13.1 – 17.0)
# ════════════════════════════════════════════════════════════════════════════
Z4x,Z4w = 13.1, 3.9
zone(Z4x, 7.5, Z4w, 9.1, face="#130d1e", edge=PURPLE, title="AZURE AI SERVICES")

node(Z4x+Z4w/2, 15.7, 3.4, 0.78, face="#1e0d3a", edge=PURPLE,
     title="Azure OpenAI Service", sub="inf-vz-openai-poc.openai.azure.com")
node(Z4x+Z4w/2, 14.6, 3.4, 0.78, face="#1a0d2e", edge=PURPLE,
     title="Model: gpt-5.5", sub="API ver 2024-12-01-preview  |  PTU")
node(Z4x+Z4w/2, 13.5, 3.4, 0.78, face="#0f1c30", edge=BL,
     title="litellm  acompletion", sub="async  |  Semaphore(20)  |  per-record")
node(Z4x+Z4w/2, 12.4, 3.4, 0.78, face="#0d1826", edge=BL,
     title="Single Combined Prompt", sub="signals+policy+evidence+retrieval")
node(Z4x+Z4w/2, 11.3, 3.4, 0.78, face="#0d1e26", edge=TEAL,
     title="LLM Skip Threshold", sub="conf >= threshold  =>  stub (~70% skip)")
node(Z4x+Z4w/2, 10.2, 3.4, 0.78, face="#0d2e1a", edge=GREEN,
     title="Stub Fallback", sub="deterministic only  |  no API key required")
node(Z4x+Z4w/2, 9.1, 3.4, 0.78, face="#130d1e", edge=PURPLE,
     title="Azure AI Search", sub="vector index  |  semantic retrieval (prod)")
node(Z4x+Z4w/2, 8.2, 3.4, 0.72, face=PANEL, edge=PURPLE,
     title="OpenAI Embedding Model", sub="text-embedding-3-small (prod)")

# ════════════════════════════════════════════════════════════════════════════
# ZONE 5  AZURE DATA SERVICES  (x 13.1 – 17.0)
# ════════════════════════════════════════════════════════════════════════════
Z5x,Z5w = 13.1, 3.9
zone(Z5x, 1.0, Z5w, 6.0, face="#0a1e1a", edge=TEAL, title="AZURE DATA SERVICES")

data_nodes = [
    ("Azure Database for PostgreSQL","Flexible Server  |  pgvector ext.  |  HA", TEAL),
    ("Azure Blob Storage","file uploads  |  SAS tokens  |  lifecycle policy", TEAL),
    ("Azure Service Bus  Premium","dead-letter  |  KEDA trigger  |  at-least-once", ORANGE),
    ("Azure Cache for Redis","session cache  |  rate limit counters", RED),
    ("Azure Cosmos DB","audit archive  |  append-only  |  change feed", PURPLE),
]
for i,(t,s,e) in enumerate(data_nodes):
    node(Z5x+Z5w/2, 6.2-i*1.03, 3.4, 0.78, face=PANEL, edge=e, title=t, sub=s)

# ════════════════════════════════════════════════════════════════════════════
# ZONE 6  AZURE PLATFORM SERVICES  (x 17.3 – 21.5)
# ════════════════════════════════════════════════════════════════════════════
Z6x,Z6w = 17.3, 4.2
zone(Z6x, 1.0, Z6w, 15.6, face="#0a0d18", edge=GRAY, title="AZURE PLATFORM SERVICES")

plat = [
    ("Azure Container Registry","private  |  geo-replicated  |  vuln scan", AZURE),
    ("Azure Key Vault","API keys  |  DB conn strings  |  certs", AZURE),
    ("Azure Entra ID (AAD)","OIDC  |  Finance/Lead/Admin roles  |  RBAC", BL),
    ("Azure API Management","rate limit  |  PTU routing  |  LLM gateway", AZURE),
    ("Azure Monitor","metrics  |  alerts  |  dashboards", GREEN),
    ("Application Insights","distributed trace  |  agent pipeline spans", GREEN),
    ("Log Analytics Workspace","centralized logs  |  KQL  |  90d retention", GREEN),
    ("GitHub Actions CI/CD","build -> ACR -> Container Apps rolling deploy", GRAY),
    ("Azure Policy","guardrails  |  SOX / FedRAMP compliance", ORANGE),
    ("Azure Container Apps Jobs","nightly cron scheduler  |  02:00 UTC", GR),
    ("Azure Private DNS Zones","private endpoint name resolution", "#4a6fa5"),
]
for i,(t,s,e) in enumerate(plat):
    node(Z6x+Z6w/2, 15.6-i*1.36, 3.7, 0.84, face=PANEL, edge=e, title=t, sub=s)

# ════════════════════════════════════════════════════════════════════════════
# ARROWS
# ════════════════════════════════════════════════════════════════════════════

# User -> Front Door
arr(Z1x+Z1w, 13.3, Z2x, 13.5, c=BL, lw=1.6, head=10)
arr(Z2x, 13.1, Z1x+Z1w, 13.0, c=GR, lw=1.3, head=8)

# Front Door -> Container Apps (API)
arr(Z2x+Z2w, 13.5, Z3x, 15.2, c=BL, lw=1.6, head=10)
arr(Z3x, 14.9, Z2x+Z2w, 13.2, c=GR, lw=1.3, head=8)

# FastAPI -> Ingestion / Job
arr(Z3x+1.6, 14.84, Z3x+1.6, 14.36, c=ORANGE, lw=1.2)
arr(Z3x+4.6, 14.84, Z3x+4.6, 14.36, c=ORANGE, lw=1.2)

# Ingestion -> Records/Review
arr(Z3x+1.6, 13.64, Z3x+1.6, 13.21, c=GR, lw=1.1)
arr(Z3x+4.6, 13.64, Z3x+4.6, 13.21, c=RED, lw=1.1)

# Records/Review -> Audit
arr(Z3x+1.6, 12.49, Z3x+1.6, 12.16, c=RED, lw=1.1)
arr(Z3x+4.6, 12.49, Z3x+4.6, 12.16, c=RED, lw=1.1)

# Orchestrator -> Connectors
arr(Z3x+Z3w/2, 4.49, Z3x+Z3w/2, 4.0, c=TEAL, lw=1.2)

# Orchestrator <-> LLM  (pre-fetch)
arr(Z3x+Z3w, 4.85, Z4x, 13.5, c=PURPLE, lw=1.6, head=10)
arr(Z4x, 13.2, Z3x+Z3w, 4.6, c=PURPLE, lw=1.2, head=8)

# LLM internal chain
arr(Z4x+Z4w/2, 15.31, Z4x+Z4w/2, 14.99, c=PURPLE, lw=1.1)
arr(Z4x+Z4w/2, 14.21, Z4x+Z4w/2, 13.89, c=PURPLE, lw=1.1)

# LangGraph -> Classifier
box_mid_y = (6.15+3.6)/2 + 6.15 - 3.6/2   # approx bottom of pipeline sub-zone
arr(Z3x+Z3w/2, 6.15, Z3x+Z3w/2, 7.84, c=PURPLE, lw=1.3)
arr(Z3x+Z3w/2, 7.06, Z3x+Z3w/2, 6.99, c=PURPLE, lw=1.2)

# Service Bus -> Worker (KEDA)
arr(Z5x, 4.15, Z3x+Z3w, 4.0, c=ORANGE, lw=1.5, head=10)

# Orchestrator -> Service Bus (publish)
arr(Z3x+Z3w, 3.0, Z5x, 3.6, c=ORANGE, lw=1.3, head=8)

# Containers -> PostgreSQL
dash(Z3x+Z3w, 2.65, Z5x, 5.65, c=TEAL, lw=1.2)
# Containers -> Blob Storage
dash(Z3x+Z3w, 3.0, Z5x, 4.65, c=TEAL, lw=1.0)
# Audit -> Cosmos DB
dash(Z3x+Z3w, 11.8, Z5x, 1.9, c=PURPLE, lw=1.0)

# Key Vault -> Container Apps (managed identity)
dash(Z6x, 14.6, Z3x+Z3w, 14.6, c=AZURE, lw=1.0)
# ACR -> Container Apps (image pull)
dash(Z6x, 15.6, Z3x+Z3w, 15.2, c=AZURE, lw=1.0)
# Monitor -> Container Apps
dash(Z6x, 12.6, Z3x+Z3w, 11.8, c=GREEN, lw=0.9)
# App Insights -> Container Apps
dash(Z6x, 11.2, Z3x+Z3w, 10.5, c=GREEN, lw=0.9)
# APIM -> Azure OpenAI
dash(Z6x, 9.8, Z4x+Z4w, 14.2, c=AZURE, lw=1.0)

# Connectors -> (data sources are file uploads to Blob)
arr(Z3x+1.6, 3.39, Z3x+1.6, 3.11, c=TEAL, lw=1.1)
arr(Z3x+4.6, 3.39, Z3x+4.6, 3.11, c=TEAL, lw=1.1)

# ════════════════════════════════════════════════════════════════════════════
# SCALING CALLOUT  (annotation on worker zone)
# ════════════════════════════════════════════════════════════════════════════
box(Z3x+0.2, 1.82, 2.8, 0.58, face="#0a1e10", edge=GR, lw=1, alpha=0.9, r=0.15)
txt(Z3x+0.2+1.4, 1.82+0.29,
    "KEDA: scale 0->20 on queue depth",
    sz=7.0, c=GR, wt="bold")

# ════════════════════════════════════════════════════════════════════════════
# LEGEND
# ════════════════════════════════════════════════════════════════════════════
items = [
    (BL,     "HTTP request/response"),
    (PURPLE, "LLM API call (async)"),
    (TEAL,   "DB / storage read-write"),
    (ORANGE, "Service Bus job queue"),
    (GREEN,  "classification output"),
    (AZURE,  "platform integration (Key Vault / ACR)"),
    (GRAY,   "future / dashed = prod replacement"),
]
for i,(c,lbl) in enumerate(items):
    lx = 0.3 + i*3.8
    ax.plot([lx, lx+0.65],[0.38,0.38], color=c, lw=2.3, zorder=5)
    txt(lx+0.8, 0.38, lbl, sz=7.8, c=GRAY, ha="left")

# ════════════════════════════════════════════════════════════════════════════
# SAVE
# ════════════════════════════════════════════════════════════════════════════
for ext in ("png", "pdf"):
    out = OUT / f"EAC_Azure_Architecture.{ext}"
    fig.savefig(out, dpi=200 if ext=="png" else 150,
                bbox_inches="tight", facecolor=BG)
    print(f"Saved: {out}")
plt.close(fig)
