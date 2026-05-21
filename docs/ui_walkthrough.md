# EAC System — UI Walkthrough

## Links

| | URL |
|---|---|
| **Frontend (Vercel)** | https://inf-vz-eac-system.vercel.app |
| **GitHub** | https://github.com/Ajalagam22/INF-VZ-EAC-System |

---

## Navigation

The left sidebar has seven modules. Each maps to a specific role and task.

---

### 1. Dashboard

The home screen. Shows the current run's summary at a glance.

- **Metric cards** — Records Processed, CapEx Share, OpEx Share, Review Queue count, Quarantined count, Average Confidence, Estimated CapEx Exposure (dollar proxy from labor hours), and Conflict Rate (how often humans corrected the machine).
- **Donut chart** — Visual CapEx / OpEx / Review split with percentages.
- **Run Manifest** — Compact list of totals: parsed, classified, sent for review, quarantined, form match rate.
- **Capitalisation Shift** — Shows estimated CapEx exposure in dollars, highlighting the financial impact of correct classification.

---

### 2. Activity Records

Full table of every classified record from the current run.

- Each row shows: Employee key, Activity Type, Classification (CapEx / OpEx / Review), Confidence score, Evidence note, and Source (Excel or DOCX form).
- **Evidence column** is truncated with tooltip — click to expand.
- **Row click** opens an inline detail panel with the Signal Ledger (which signals fired and their weights) and the Agent Pipeline Trace (each LangGraph node's output).

---

### 3. Review Queue

Only shows records the system is not confident about (low confidence or `Review` classification that haven't been overridden yet).

- **Override selector** — choose CapEx, OpEx, or Review with an optional note. Once submitted, the record is removed from the queue and the correction is logged as an audit event.
- **Inspect Trace** button — jumps to the Audit Trail and scrolls to that record's full event history.
- Empty state when all records have been reviewed or no low-confidence records exist.

---

### 4. Analytics

Charts and breakdowns across the full classified dataset.

- Classification distribution by activity type, team, and cost class.
- Confidence score histogram — shows how spread out the model's certainty is.
- CapEx vs OpEx spend breakdown by department.
- Useful for identifying patterns (e.g. a team that's systematically under-capitalising).

---

### 5. Audit Trail

Compliance view — full event history for every record.

- Each record has a timeline of events: `classified`, `quarantined`, `override`.
- **Agent Pipeline Trace** — expandable panel showing all six LangGraph node outputs (Harvesting, Context, Retrieval, Policy, Classification, Routing), the LLM provider and model used, and the signal ledger at each step.
- Immutable — events are append-only. Overrides create a new event referencing the original; the original is never modified.

---

### 6. Data Sources

Three sub-tabs for getting data into the system.

**Connectors**
- **Upload Excel** — drag-and-drop or file-pick `Test data May 19.xlsx`. Starts the backend pipeline immediately; records stream into Activity Records in real time as each one is classified.
- **Upload Forms ZIP** — upload `Sample Forms.zip` containing DOCX survey forms. The form parser extracts 39 fields per form and runs classification on each extracted record.
- **Connector Catalog** — shows future connectors (SharePoint, Google Drive, BigQuery, Jira, Slack, MCP Servers) as extensibility proof points. Currently stubs.

**Form Extraction Validation**
- Side-by-side comparison of fields extracted from each DOCX form against the corresponding Excel row.
- Shows match rate per form (% of fields that match within tolerance) and flags any mismatches at field level.
- Confirms the three-layer regex parser is reading the forms correctly.

**Pipeline** *(Architecture View)*
- Visual diagram of the end-to-end data flow from connector through the LangGraph pipeline to the database.

---

### 7. Feedback Learning

Governance stub for the continual learning roadmap.

- Shows a log of all human overrides (corrections) made in the Review Queue.
- In production this feeds the signal weight recalibration job and the RAG precedent index.
- Currently read-only — the override events are persisted and displayed but no retraining runs in the POC.

---

## Test Files

| File | What it contains |
|---|---|
| `Test data May 19.xlsx` | 148 network engineering activity records |
| `Sample Forms.zip` | 10 DOCX project-cost forms, 39 fields each |

Upload Excel first, then Forms. The Form Extraction Validation tab will match form records against the loaded Excel rows automatically.
