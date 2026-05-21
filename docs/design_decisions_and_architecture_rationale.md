# EAC System Design Decisions and Architecture Rationale

## Purpose

This document records the major product, architecture, UI, and implementation decisions discussed for the Employee Activity Classification (EAC) system. The intent is to make the system defensible to senior architects, accounting SMEs, and senior engineers reviewing whether the design can scale beyond a POC into a reliable production capability.

The project is treated as a production-grade feature system with a public POC delivery surface, not as a throwaway demo.

## Guiding Principles

1. **Deterministic-first classification**
   The final CapEx / OpEx / Review decision must be repeatable, explainable, and governed by versioned policy rules.

2. **AI-assisted, not AI-authoritative**
   LLMs and semantic retrieval help with extraction, mapping, explanation, and precedent discovery. They do not silently own the accounting decision.

3. **Source-agnostic engine**
   The classification engine consumes normalized activity records. It does not know whether a record came from Excel, DOCX forms, HRIS, ERP, Jira, Slack, or another connector.

4. **Review is a safety mechanism**
   Low-confidence or conflicting records route to domain leads for review. The system should prefer review over an unjustified automated answer.

5. **Auditability by design**
   Every classification needs input signals, rule version, confidence, evidence, output, and override history.

6. **Governed learning**
   Manual overrides and confirmations improve the system over time, but updates are evaluated offline and promoted through approval. No silent self-learning.

## Delivery Posture

### Decision

The submitted application should remain public and no-login, while the architecture and UI communicate the future production-grade design.

### Why

The assessment requires a publicly accessible Vercel URL with no authentication. A login wall creates evaluation risk. However, the system domain involves employee and financial data, so the architecture must still explain production RBAC and data controls.

### Tradeoff

- **Pros:** Lower deployment risk, easier evaluator access, simpler Vercel setup.
- **Cons:** POC does not demonstrate real role-based authorization.
- **Mitigation:** Document production roles: employee, domain team lead, finance reviewer, admin, platform operator.

## UI and Product Design

### Decision

Use an enterprise command-center UI for EAC.

### Why

EAC needs to feel like a production workflow system, not a file-upload demo. The UI should organize complex classification operations into clear modules: data sources, pipeline, activity records, review, audit, policies, feedback learning, analytics, and architecture.

### Product Model

| Capability | EAC Surface |
| --- | --- |
| Data ingestion | Data Sources |
| Normalized work items | Activity Records |
| Classification workflow | Agent Pipeline |
| Human review | Review Queue |
| Decision traceability | Audit Trail |
| Governance | Rules & Policies |
| Continuous improvement | Feedback Learning |
| Business reporting | Analytics |

### Implemented UI Areas

- Dashboard
- Data Sources
- Agent Pipeline
- Activity Records
- Review Queue
- Audit Trail
- Rules & Policies
- Feedback Learning
- Analytics
- Architecture

### Tradeoff

- **Pros:** Looks like an enterprise product, communicates architecture clearly, covers evaluation requirements.
- **Cons:** More UI surface area than a minimal upload-table demo.
- **Mitigation:** Keep each page focused on required proof points.

## Branding

### Decision

Adopt a black, white, red, and neutral-gray theme with configurable brand values.

### Why

The system should feel production-grade and domain-relevant without hardcoding a large image or external dependency.

### Implementation

Brand settings are controlled by frontend-safe environment variables:

- `NEXT_PUBLIC_BRAND_NAME`
- `NEXT_PUBLIC_BRAND_SUBTITLE`
- `NEXT_PUBLIC_BRAND_IMAGE_SRC`
- `NEXT_PUBLIC_APP_TITLE`
- `NEXT_PUBLIC_APP_DESCRIPTION`

### Tradeoff

- **Pros:** Easy to rebrand, Vercel-safe, no source-code change for titles/logos.
- **Cons:** The POC uses a lightweight self-contained brand mark unless a logo asset is provided.
- **Mitigation:** `NEXT_PUBLIC_BRAND_IMAGE_SRC` supports a public asset path or data URL.

## Configuration and Environment Variables

### Decision

Move configurable values out of the page and into a config module backed by environment variables.

### Why

Hardcoded operational values make senior review harder and create future deployment risk. Values such as rule version, review threshold, persona, brand name, and semantic store label should be configurable.

### Configured Values

- Brand name and subtitle
- Brand image source
- App title and description
- Reviewer view label
- Rule version
- Persona name
- Review threshold
- Semantic store label
- Decision authority label

### Tradeoff

- **Pros:** Cleaner deployment, easier review, better production posture.
- **Cons:** Public `NEXT_PUBLIC_*` values are exposed in the browser.
- **Mitigation:** Only non-secret configuration is placed in `NEXT_PUBLIC_*`. Secrets remain server-side only.

## Data Connectors

### Decision

Implement two active connectors and show all other connectors as Coming Soon.

### Required Active Connectors

1. Excel dataset connector
   - Uploads and parses `EAC_Dataset.xlsx`.
   - Runs the full classification workflow.

2. DOCX form parser connector
   - Uploads and parses `sample_forms.zip`.
   - Extracts 39 structured fields from 10 forms.
   - Maps fields to the same normalized schema as Excel.
   - Validates extracted records against Excel keys.

### Coming Soon Connectors

- Google Drive
- SharePoint
- BigQuery
- Google Sheets
- Jira
- Slack
- Workday HRIS
- ERP / finance rules

### Why

The requirements explicitly require Excel and form connectors to be functional and require a Coming Soon connector panel to demonstrate pluggability.

### Tradeoff

- **Pros:** Satisfies assessment while proving extension design.
- **Cons:** Future connectors are not functional in the POC.
- **Mitigation:** Architecture document describes the connector contract and production replacement path.

## Stubbed Data

### Decision

Use stubs for non-provided enterprise data contexts.

### Stubbed Contexts

- HR profile data
- Investment / funding context
- Historical survey labels
- Fixed asset accounting policy source system
- Audit persistence
- Worker topology and staging storage

### Why

The requirements explicitly permit simulated or hardcoded data beyond the two provided inputs. The key is to clearly document each stub and production replacement.

### Production Replacements

| Stub | Production Replacement |
| --- | --- |
| HR profile context | Workday / HRIS connector |
| Investment / funding context | ERP / finance planning connector |
| Accounting rules | Versioned policy/rules service |
| Historical labels | Capital labor survey warehouse |
| Audit persistence | Immutable audit event store |
| Batch orchestration | Persisted job queue with a worker loop |

## Multi-Agent Architecture

### Decision

Represent the system as a multi-agent classification pipeline.

### Why

The requirements explicitly call for an agent architecture: orchestrator, data harvesting, context building, classification, policy/rules, and confidence/routing. A multi-agent architecture also makes responsibilities clear and scalable.

### Recommended Agent Graph

1. Flow Orchestrator Agent
   Coordinates run state, sequencing, retries, and run manifests.

2. Data Harvesting Agent
   Runs active connectors and validates ingested records.

3. Normalization Agent
   Maps connector output into `NormalizedActivityRecord`.

4. Context Builder Agent
   Adds persona, HR, funding, time-window, and survey context.

5. Semantic Precedent Agent
   Retrieves similar reviewed records and relevant policy excerpts.

6. Policy & Rules Agent
   Applies versioned fixed asset accounting policy.

7. Classification Agent
   Produces CapEx / OpEx / Review, confidence, and evidence.

8. Confidence Routing Agent
   Routes high-confidence outputs and low-confidence review cases.

9. Audit Agent
   Writes trace data for compliance and review.

10. Feedback Learning Agent
   Converts overrides into governed training and calibration data.

11. Analytics Agent
   Computes capitalization shift, conflict rate, and source quality metrics.

### Framework Decision

Use an LLM-assisted agent graph as the production-aligned architecture direction.

### Why

An LLM-assisted agent graph is suitable for orchestrated workflows and aligns well with a Next/Vercel POC plus future production agent services. The current implementation uses a governed LLM client abstraction rather than a hard dependency on a specific agent framework.

### Tradeoff

- **Pros:** Strong multi-agent story, modular responsibilities, future-ready.
- **Cons:** A full workflow framework adds implementation overhead.
- **Mitigation:** UI and architecture describe the agent graph; runtime integration can be swapped or extended later.

## Classification Technique

### Decision

Use a hybrid approach, but keep deterministic policy rules as the decision authority.

### Why

The requirements allow rule-based, prompt-based, or hybrid classification. For accounting and audit review, a deterministic policy-led engine is more defensible than an LLM-only classifier.

### Role of Each Technique

| Technique | Role |
| --- | --- |
| Deterministic rules | Final decision authority |
| Signal weighting | Confidence and evidence support |
| LLM | Form extraction, messy text interpretation, evidence wording |
| Vector retrieval | Similar precedent and policy context |
| Human review | Safety layer for ambiguity |

### Tradeoff

- **Pros:** Repeatable, explainable, auditable, low failure risk.
- **Cons:** Initial rules may miss nuanced cases.
- **Mitigation:** Add semantic retrieval and governed feedback learning.

## LLM Usage

### Decision

Use LLMs only for bounded assistive tasks.

### Appropriate LLM Uses

- Extract narrative fields from DOCX form text.
- Normalize messy activity descriptions.
- Generate plain-language evidence notes.
- Explain ambiguity.
- Summarize why records require review.

### Inappropriate LLM Uses

- Sole final CapEx / OpEx decision-maker.
- Silent production rule changes.
- Undocumented policy interpretation.

### Reliability Controls

- Temperature 0 for extraction.
- JSON schema validation for outputs.
- Parser confidence tracking.
- Missing field handling.
- Human review routing.

## Vector Database / Semantic Retrieval

### Decision

Use a vector database as a semantic support layer, not the final decision layer.

### Recommended Production Store

Use PostgreSQL with `pgvector` first.

### Why

`pgvector` keeps normalized records, classification metadata, feedback labels, and embeddings close together. This simplifies audit joins and reduces system complexity.

### Use Cases

- Retrieve similar historical reviewed records.
- Retrieve past override precedents.
- Match messy activity descriptions to known survey categories.
- Retrieve relevant accounting policy snippets.
- Detect recurring ambiguous patterns.

### Guardrail

The vector DB retrieves context. The policy-led classification engine makes the final decision.

### Tradeoff

- **Pros:** Better semantic accuracy, feedback reuse, precedent-aware evidence.
- **Cons:** Similarity is not the same as accounting correctness.
- **Mitigation:** Keep semantic matches as supporting evidence with confidence impact only.

## Feedback Learning

### Decision

Implement governed feedback learning from manual confirmations and overrides.

### Why

Manual overrides are labeled examples. They should improve future classification accuracy over time. However, this is better described as supervised feedback learning rather than classic reinforcement learning.

### Feedback Loop

1. System predicts classification.
2. Human confirms or overrides.
3. Feedback event captures original output, final label, signal snapshot, rule version, reviewer note.
4. Offline process analyzes conflict patterns.
5. Rule weights or supervised model are calibrated.
6. Updated rule/model version is evaluated.
7. Accounting/finance approval promotes the version.

### Guardrails

- No silent self-learning.
- No automatic model promotion.
- Historical results retain original rule/model versions.
- Feedback learning requires offline evaluation and approval.

### Tradeoff

- **Pros:** Accuracy improves with real reviewer behavior.
- **Cons:** Adds governance complexity.
- **Mitigation:** Treat feedback as supervised calibration data and promote through versioned releases.

## Database Decision

### POC Decision

Do not require a database for the public Vercel POC.

### Why

The evaluator needs a reliable public URL with no login. A database requirement creates setup and availability risk. Browser memory is acceptable for demonstrating upload, classification, review, and audit surfaces.

### Production Decision

Use a real persistence layer.

### Recommended Production Stores

- Object storage for uploaded Excel/DOCX files and raw artifacts.
- PostgreSQL for normalized records, classifications, rules, run manifests, feedback, and audit metadata.
- `pgvector` for semantic embeddings.
- Queue/job system for nightly batch orchestration.
- Immutable append-only audit event table.

### Tradeoff

- **Pros of no DB in POC:** Reliable, simple, easy to deploy.
- **Cons:** No persistence across sessions.
- **Mitigation:** UI and docs clearly describe production persistence.

## Audit Trail

### Decision

Represent audit trail in the UI as a production-shaped navigable stub.

### Why

The requirements explicitly allow an audit trail stub, but it must show how production traceability would work.

### Audit Record Contents

- Input source
- Extracted fields
- Normalized record
- Signals used
- Rule version
- Semantic precedents
- Classification output
- Confidence score
- Human override
- Reviewer note
- Timestamp

### Tradeoff

- **Pros:** Satisfies POC and explains production defensibility.
- **Cons:** Stub does not provide immutable storage.
- **Mitigation:** Production design uses append-only audit events.

## Dashboard Copy and Metric Naming

### Decision

Use precise, defensible dashboard language.

### Why

Senior reviewers may challenge exaggerated claims. The dashboard should avoid implying official finance recognition or completed production integration.

### Copy Adjustments

- Use `Employee Activity Classification Dashboard` instead of overly broad command-center language.
- Use `Estimated CapEx Exposure` instead of official `Capitalization Shift`.
- Use `LLM-assisted multi-agent architecture` instead of claiming a specific framework runtime.
- Describe dollar metrics as POC proxy estimates.

### Tradeoff

- **Pros:** More accurate and defensible.
- **Cons:** Slightly less flashy.
- **Mitigation:** Maintain strong visual design while using precise language.

## Reliability and Failure-Minimization Strategy

### Decision

Design for minimal failures using deterministic fallback behavior and review routing.

### Controls

- Schema validation before classification.
- Standard normalized record contract.
- Confidence penalties for missing fields.
- Review route for conflicting signals.
- Rule version on every output.
- Semantic retrieval is assistive only.
- LLM outputs must be schema-validated.
- Run manifest per batch.
- Immutable audit trail in production.
- No automatic model/rule changes.

### Why

The ideal system goal is accurate, deterministic, and minimally fragile classification. Financial classification errors are more costly than routing uncertain records to review.

## Current POC Implementation Notes

The current frontend implements:

- Public no-login Next.js app.
- Configurable shell and branding config.
- Excel upload and classification.
- DOCX ZIP parsing and Excel key validation.
- Enterprise navigation and dashboard.
- Multi-agent pipeline visualization.
- Deterministic rule-weighted classification.
- Manual override controls.
- Review queue.
- Audit trail with signal ledger and semantic precedent stub.
- Feedback learning dashboard.
- Architecture page with production controls.
- Environment-backed frontend configuration.

## Known Gaps to Address for Production

- Real database persistence.
- Real object storage for uploaded files.
- Server-side connector services.
- Real workflow orchestration runtime.
- Real LLM extraction service with JSON schema validation.
- Real pgvector embeddings and retrieval.
- Immutable audit event store.
- Production RBAC.
- Offline model/rule evaluation pipeline.
- SME approval workflow for rule/model promotion.

## Summary

The recommended design is a deterministic, policy-led classification platform with AI-assisted extraction and semantic retrieval. It uses human review and auditability as first-class safety mechanisms, and it improves over time through governed feedback learning. This approach balances POC deliverability with the production-grade reliability expected by senior architects, finance SMEs, and engineering reviewers.
