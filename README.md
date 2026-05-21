# Employee Activity Classification System

AI-enabled CapEx / OpEx activity classification for the EAC candidate assessment — UC-1 Network Annual Capital Labor Survey.

## What Was Built

- **Next.js 14 dashboard** — upload, classify, review, audit, analytics, connector marketplace, architecture view
- **FastAPI backend** — LangGraph 6-node agentic pipeline, job-based async ingestion, SQLAlchemy + SQLite (WAL mode)
- **Active connectors** — Excel workbook (148 records), DOCX form ZIP (10 forms, 39 fields each)
- **Classification engine** — rule-weighted CapEx / OpEx / Review with confidence score, evidence note, and signal ledger
- **Agentic pipeline** — Harvesting → Context → Retrieval → Policy → Classification → Routing; full trace visible in Audit Trail
- **Async LLM pipeline** — single combined Azure OpenAI call per record, 20 concurrent via `asyncio.Semaphore`, chunked in batches of 100; gracefully stubs when no API key is configured
- **Form Extraction Validation** — field-level side-by-side comparison against Excel mapping; match rate shown per form
- **Human override + Review Queue** — low-confidence records routed for human correction with audit event
- **Feedback Learning / Rules & Policies** — governance stubs wired to UI

## Quick Start

**Terminal 1 — backend:**

```bash
cd backend
cp ../.env.example .env          # fill in LLM_API_KEY if you want real LLM traces
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

**Terminal 2 — frontend:**

```bash
cd frontend
cp ../.env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`, then upload:

- `Test data May 19.xlsx` (148 Excel activity records)
- `Sample Forms.zip` (10 DOCX project-cost forms)

The system works fully without an LLM key — classification, confidence scores, signals, and evidence notes are all deterministic. LLM adds policy rationale and enriched evidence language on top.

The standalone worker is only needed for production queue deployments:

```bash
cd backend
python3 -m app.workers.ingestion_worker
```

### Clean start (before a demo)

```bash
rm backend/eac.db backend/eac.db-shm backend/eac.db-wal 2>/dev/null; true
```

The backend recreates an empty database on first request.

## Demo Walkthrough (UC-1)

1. **Data Sources → Upload Excel** (`Test data May 19.xlsx`). Pipeline queues and classifies automatically.
2. **Dashboard** — confirm 148 records classified: CapEx ~51%, OpEx ~27%, Review ~22%, Avg Confidence 80, ~$2.4M estimated CapEx exposure.
3. **Data Sources → Upload Forms** (`Sample Forms.zip`). Form parser extracts 39 fields per DOCX form.
4. **Data Sources → Form Extraction Validation** — confirm 10/10 forms matched at 100% match rate; inspect field-level comparison table.
5. **Activity Records** — spot-check per-record evidence notes, confidence scores, and signal ledger.
6. **Review Queue** — select a low-confidence record; use override selector to demonstrate human correction.
7. **Review Queue → Inspect Trace** — navigates to Audit Trail and scrolls to the correct record; expand to see Agent Pipeline Trace (Harvesting Agent, Classification Agent steps with Azure OpenAI provider), Signal Ledger, and Semantic Precedents.
8. **Dashboard → Capitalisation Shift** — confirm estimated CapEx exposure metric (~$2.4M).
9. **Data Sources → Connector Catalog** — show future connectors (Google Drive, SharePoint, BigQuery, Jira, Slack, MCP Servers) as extensibility proof.
10. **Feedback Learning / Rules & Policies** — governance context.

## Architecture

The frontend calls the backend API when `NEXT_PUBLIC_API_BASE_URL` is set. Without it, the frontend falls back to client-side classification (xlsx.js + JSZip) using the same rule logic.

Backend pipeline stages:

| Stage | Module |
|---|---|
| Connector / extraction | `app/connectors/excel/`, `app/connectors/docx/` |
| Schema normalisation + quarantine | `app/connectors/*/normalizer.py`, row quality check |
| Async LLM pre-fetch (chunked, semaphore-gated) | `app/agents/pipeline.py` → `prefetch_llm` |
| Context enrichment | `app/agents/nodes/context.py` |
| Semantic retrieval | `app/agents/nodes/retrieval.py` |
| Policy evaluation (GAAP / IAS 16) | `app/agents/nodes/policy.py` |
| Classification (deterministic, authoritative) | `app/classifiers/hybrid_classifier.py` |
| Routing | `app/agents/nodes/routing.py` |
| Job queue + status polling | `app/models/ingestion_job.py`, `app/orchestrator/flow_orchestrator.py` |
| Audit event log | `app/audit/audit_service.py` |

### LLM pipeline design

One combined `litellm.acompletion` call per record replaces the previous 4 sequential calls. The orchestrator pre-fetches all LLM results for a chunk of 100 records concurrently under a shared `asyncio.Semaphore(20)` before running the sync LangGraph pipeline. DB writes stay synchronous throughout — the SQLAlchemy session is never shared across threads or coroutines.

Set `LLM_SKIP_THRESHOLD=85` in production to skip LLM for records where the deterministic rules already score ≥ 85% confidence — typically ~70% of a clean dataset — cutting total LLM calls by ~70% with no classification accuracy impact.

| Records | LLM calls (threshold=0) | Time @ 20 concurrent |
|---|---|---|
| 148 | 148 | ~15–30 s |
| 1 000 | 1 000 | ~1–2 min |
| 10 000 | 10 000 | ~5–8 min |
| 100 000 | 100 000 | ~45–60 min |

With `LLM_SKIP_THRESHOLD=85` the call count drops by ~70%, roughly halving those times.

See [`docs/architecture_document.md`](docs/architecture_document.md) and [`docs/stubs.md`](docs/stubs.md).

## Environment Variables

Copy `.env.example` to `backend/.env` (and `frontend/.env.local` for the frontend):

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | SQLite `eac.db` | SQLAlchemy connection string |
| `INGESTION_STAGING_DIR` | `backend/tmp/ingestion_jobs` | Staged upload payloads |
| `LLM_PROVIDER` | `azure_openai` | `azure_openai`, `openai`, or `openai_compatible` |
| `LLM_API_KEY` | — | API key; leave blank to use stub LLM |
| `LLM_API_BASE_URL` | — | Endpoint URL for Azure OpenAI |
| `LLM_API_VERSION` | `2024-12-01-preview` | Azure OpenAI API version |
| `LLM_MODEL` | `gpt-4o-mini` | Model name (e.g. `gpt-4.1-mini`) |
| `LLM_SKIP_THRESHOLD` | `0` | Skip LLM for records with deterministic confidence ≥ this value; `0` = never skip |
| `LLM_CONCURRENCY` | `20` | Max concurrent async LLM calls per chunk |
| `LLM_CHUNK_SIZE` | `100` | Records per async batch |
| `LLM_TIMEOUT_SECONDS` | `30` | Per-call timeout |
| `CORS_ORIGINS` | — | Comma-separated allowed origins; set to your Vercel URL in production |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8001` | Backend URL as seen from the browser |

## Deployment

**Frontend (Vercel):** Set project root to `frontend/`. Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL in the Vercel environment variables dashboard.

**Backend:** Deploy to any Python host (Railway, Render, Fly.io, Docker). Set `CORS_ORIGINS` to your Vercel frontend URL.

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Ingestion flow: [`docs/ingestion_job_flow.md`](docs/ingestion_job_flow.md).

## Known Stubs

- HR profile data is derived from uploaded activity rows, not a live HRIS integration.
- Investment/funding designations are inferred from workbook fields, not a live ERP.
- Semantic precedent retrieval (pgvector) is powered by LLM when configured; production would use a vector store with real historical classifications.
- Feedback learning persists overrides in the database; production would write to a governed labeled-data store.
- The final CapEx / OpEx / Review decision is always deterministic — LLM adds reasoning context only.
- File staging uses local disk; production should use S3 / GCS / Azure Blob.
