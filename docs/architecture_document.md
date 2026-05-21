# Employee Activity Classification System
## Architecture and Design Document

**Submission:** UC-1 Network Annual Capital Labor Survey  
**Author:** Ajith Jalagam  
**Date:** May 21, 2026  
**Version:** 2.0: Azure Production Architecture  

---

## 1. Problem Statement Analysis

### 1.1 The Financial Stakes

To understand why this system matters, it helps to start with the accounting mechanics rather than the technology. Under GAAP ASC 350-40 and IAS 16, a company that employs engineers to build long-lived assets, network infrastructure, software platforms, capital equipment, is required to capitalize the labor cost associated with that construction. "Capitalizing" means treating the labor as an asset on the balance sheet, amortizing it over the asset's useful life, and not expensing it in the year it was incurred. The consequence of this rule is straightforward: a dollar of labor correctly classified as capital does not reduce operating income in the current period. A dollar incorrectly booked as operating expense reduces it by a dollar, permanently.

For a technology or telecommunications company with tens of thousands of engineers, the aggregate exposure is not marginal. If twenty thousand engineers each work two thousand hours annually, and a conservative twenty percent of that work qualifies for capitalization, the total capitalizable labor pool exceeds eight billion dollars of cost annually before any multiplier for loaded compensation rates. The financial impact of systematically under-classifying that labor, as most organizations do today, is not a rounding error on the income statement. It is a structural misrepresentation of the company's actual earnings profile, compounded year over year.

Auditors and regulators care about this in both directions. Under-capitalization understates assets and overstates expenses, artificially depressing reported income. Over-capitalization does the opposite and creates a different problem: assets that should have been expensed accumulate on the balance sheet until impairment forces a correction, at which point a large write-down appears that surprises investors and can attract SEC scrutiny. The system described in this document is specifically designed to address under-capitalization, but the audit trail and confidence scoring mechanisms are equally important for defending against over-capitalization claims, every classification is traceable to specific signals and rules, not to an employee's memory or a team lead's judgment call.

### 1.2 Why the Annual Survey Fails

The mechanism that produces the under-capitalization problem is the annual capital labor survey. The design of this survey is the root cause of the inaccuracy, and understanding its failure modes is necessary to understand why the AI-driven approach is architecturally sound rather than merely technically impressive.

The survey asks engineering employees to estimate, each May, what percentage of their time during the prior twelve months was spent on capital activities versus expense activities, across fifteen to twenty-five activity categories. The fundamental problem is that annual recall does not work for this kind of task. An employee answering questions in May about how they spent their time in January is not engaged in accurate introspection, they are constructing a plausible narrative from fragments of memory, shaped by availability bias (recent events are recalled more clearly than older ones), anchoring bias (the categories presented in the survey influence the estimates), and motivated reasoning (employees who perceive audit risk in over-claiming capital treatment will systematically under-report it regardless of whether they are entitled to it).

The practical consequence is that employees do not produce accurate percentage estimates. They produce round numbers, 50/50, 70/30, 80/20, that feel approximately right based on their most recent work and their intuitive sense of what "should" be capital. Because everyone is guessing, the aggregate numbers are smooth in a way that real activity distributions are not. Real engineering work is lumpy: a network engineer spends Q1 in a build phase for a new cell tower deployment, Q2 in maintenance, Q3 on a second build project, and Q4 in testing and commissioning. The annual survey collapses this temporal variation into a flat annual average that has no grounding in the actual sequence of events.

The second failure mode is participation. Over twenty-one thousand employees in the organization being described do not complete the survey at all. They default to one hundred percent operating expense because the survey was not sent to them, they ignored it, or they determined that the cognitive cost of completing it exceeded the perceived benefit. From a financial reporting perspective, the survey population and the non-survey population are treated differently: the survey population produces questionable estimates, and the non-survey population produces no estimate at all, which maps to one hundred percent expense. Any capitalizable labor performed by the non-survey population disappears from the balance sheet permanently. It cannot be recovered after the accounting period closes.

### 1.3 Why AI Classification Is the Correct Response

The reason an AI-driven classification system is the architecturally correct response to this problem, rather than, say, a better survey design or mandatory manager approval, is that the underlying data needed to answer the classification question already exists in systems the employees are already using. It does not need to be created; it needs to be read.

Every engineer working on a capital project leaves a continuous record of their activity in observable systems. Project management tools record which tasks they completed and which milestones they marked done. Network operations systems record which assets they commissioned, tested, or modified. Financial systems record which cost codes their time was allocated to. HR systems record their job title, job family, seniority level, and organizational unit. The combination of these signals, evaluated against a versioned set of fixed asset accounting rules, is sufficient to determine with high probability whether a given block of work qualifies for capitalization.

The employee's role in this model changes fundamentally. Rather than reconstructing a year of work from memory and translating it into accounting categories they may not fully understand, the employee receives a pre-populated draft classification based on observed activity and is asked only to confirm or correct it. The cognitive burden drops from authoring to reviewing. The accuracy improves because the input data is contemporaneous observation rather than retrospective recall. And the audit trail is transformed: instead of "the employee said 70% capital," the evidence is "the employee completed 14 build milestones, performed 8 drive tests on new infrastructure, and was assigned to capital project code CP-2025-047 for 60% of their recorded hours."

This shift in the evidence base is what makes the system defensible to auditors. It is not a matter of automating a guess, it is a matter of replacing a guess with a traceable chain of observed signals.

### 1.4 Design Constraints and Their Implications

Three constraints were confirmed by the sponsoring organization as fixed before design began. Understanding why each constraint exists illuminates the architectural choices that follow.

**Engine-first and source-agnostic.** The classification engine must be designed before the connectors, and connectors must conform to the engine's interface: not the reverse. This constraint exists because the history of enterprise data classification systems is littered with projects that built tightly coupled pipelines: the connector logic and the classification logic were interleaved, and adding a new data source required surgery on the classification engine. The engine-first constraint enforces a hard boundary: the engine receives structured records conforming to a defined schema and knows nothing about where those records came from. Whether the source is an Excel workbook uploaded by a Finance admin or a live API connection to an ERP system makes no difference to the engine. The connector is responsible for translation to the schema; the engine is responsible for classification from the schema. This separation is what makes the system extensible without rebuilds.

**Overnight batch as the primary processing model.** Signals accumulate during the day; the engine runs nightly. This is not a temporary limitation: it is a deliberate choice that shapes several important aspects of the architecture. Running batch overnight eliminates the risk of live API rate limits disrupting a classification run. It allows the full employee population to be processed in a single coherent run, which means the confidence scoring and routing decisions are made on complete data rather than partial data. It supports historical replay: if the accounting rules are updated or a classification error is discovered, the entire dataset can be reprocessed with the corrected rules. And it means the compute infrastructure can be sized for peak throughput rather than peak concurrency, enabling scale-to-zero cost optimization during the hours when the system is idle.

**Eighty percent generic coverage.** The engine must handle the dominant employee persona patterns through configuration, not code. This constraint reflects the practical reality of deploying across multiple business units, job families, and reporting cadences. If every new persona required a code change, the system would be gated on engineering capacity. By expressing persona behavior as configuration: output mode, aggregation window, signal thresholds, applicable rule set, a Finance team member can onboard a new employee population without involving the engineering team at all.

---

## 2. Azure Architecture Strategy

### 2.1 Why Azure

The architecture is built entirely on Microsoft Azure for reasons that are specific and grounded, not generic cloud preference.

Azure OpenAI is already provisioned and actively used by this system. The deployment at `inf-vz-openai-poc.openai.azure.com` running `gpt-5.5` as the production LLM endpoint. Migrating to another cloud provider's LLM offering would require re-provisioning, re-testing, and re-validating the prompt engineering work, with no quality or cost benefit. More importantly, Azure OpenAI carries a contractual guarantee that customer data is not used for model training. When processing sensitive employee financial classification data, this guarantee is a compliance requirement, not a nice-to-have.

Azure Container Apps provides exactly the scaling model this workload requires. The batch pipeline has an asymmetric load profile: near-zero traffic during the day, a sharp burst of hundreds of concurrent LLM calls during the nightly batch window, then idle again. Azure Container Apps with KEDA (Kubernetes-based Event Driven Autoscaling) scales worker containers from zero based on Azure Service Bus queue depth. This means the worker costs nothing when idle and scales automatically to handle the batch burst. No other Azure compute option, App Service, AKS, or Azure Functions, fits this profile as cleanly without either persistent over-provisioning or unacceptable operational complexity.

Azure Database for PostgreSQL Flexible Server with the pgvector extension provides a migration path from the SQLite development database that requires minimal code changes (the SQLAlchemy ORM layer is effectively unchanged) while adding the vector search capability needed for semantic precedent retrieval in production.

Azure's compliance ecosystem matters for this specific workload. Employee financial classification data is subject to internal controls under SOX. Azure's FedRAMP High, SOC 2 Type II, and ISO 27001 certifications, combined with native Azure Policy guardrails and the shared responsibility model documentation, provide the compliance posture required for a system that feeds financial reporting.

### 2.2 Service Selection Rationale

| Requirement | POC | Azure Production | Rationale |
|---|---|---|---|
| Compute / API | Local process | Azure Container Apps | KEDA auto-scale, VNet integration, scale to zero |
| LLM inference | Azure OpenAI (active) | Azure OpenAI + multi-model routing | Data residency, PTU for throughput control |
| Database | SQLite WAL | Azure PostgreSQL Flexible Server + pgvector | SQLAlchemy-compatible, vector search, HA |
| File staging | Local disk | Azure Blob Storage | Encrypted, SAS tokens, lifecycle policies |
| Job queue | Background thread | Azure Service Bus Premium | Dead-letter, KEDA trigger, at-least-once delivery |
| Secrets | .env file | Azure Key Vault | Managed identity — no stored credentials |
| Container registry | Local | Azure Container Registry | Vulnerability scanning, geo-replicated |
| Identity / RBAC | None | Azure Entra ID | Finance / Lead / Admin role groups, OIDC |
| Observability | Python logging | Azure Monitor + Application Insights | Distributed traces map to LangGraph pipeline steps |
| Semantic search | LLM-simulated | Azure AI Search + vector index | Hybrid keyword + vector, OpenAI embedding |
| Audit archive | SQLite table | Azure Cosmos DB (append-only) | WORM-equivalent, geo-redundant |
| Network security | None | Azure VNet + private endpoints | Data services unreachable from public internet |

### 2.3 Cloud Portability

The architecture is cloud-portable. The classification engine, LangGraph pipeline, and connector framework are infrastructure-agnostic Python. The only cloud-specific code is in connector implementations (reading from Blob vs S3 vs GCS) and the observability SDK initialization. Swapping clouds is a configuration and connector change, not an engine change.

| Azure Service | AWS Equivalent | GCP Equivalent |
|---|---|---|
| Container Apps (KEDA) | ECS Fargate + KEDA / App Runner | Cloud Run |
| Azure OpenAI | Amazon Bedrock (Claude / Titan) | Vertex AI (Gemini) |
| PostgreSQL Flexible + pgvector | RDS PostgreSQL + pgvector | Cloud SQL + pgvector |
| Blob Storage | S3 | Cloud Storage |
| Service Bus Premium | SQS + SNS | Pub/Sub |
| Key Vault | Secrets Manager | Secret Manager |
| Container Registry | ECR | Artifact Registry |
| Entra ID (AAD) | Cognito + IAM | Identity Platform |
| Monitor + Application Insights | CloudWatch + X-Ray | Cloud Monitoring + Trace |
| AI Search | OpenSearch Service | Vertex AI Search |
| Cosmos DB | DynamoDB (append-only table) | Firestore (append-only) |

---

## 3. System Architecture Overview

### 3.1 Layered Architecture

The production system is organized into eight logical layers. Each layer has a single responsibility and communicates with adjacent layers through a formally defined interface. No layer bypasses the interface to reach a non-adjacent layer, this is the primary mechanism that keeps the system extensible, testable, and independently deployable.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: USER SURFACE                                                       │
│  Next.js 14 SPA (Vercel CDN) — Finance Reviewer, Domain Lead, Admin roles   │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │  HTTPS
┌────────────────────────────▼────────────────────────────────────────────────┐
│  LAYER 2: EDGE / WAF                                                         │
│  Azure Front Door — DDoS protection, WAF (OWASP 3.2), CORS, SSL termination │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │  HTTP/2
┌────────────────────────────▼────────────────────────────────────────────────┐
│  LAYER 3: API GATEWAY                                                        │
│  FastAPI Router — Entra ID auth middleware, rate limiting, request routing   │
└────────┬──────────────────────────────────────────────────┬─────────────────┘
         │  sync request/response                           │  async job start
┌────────▼────────────────────┐            ┌───────────────▼─────────────────┐
│  LAYER 4: SYNC API          │            │  LAYER 5: ASYNC BATCH            │
│  Record read, override,     │            │  Ingestion job management,        │
│  audit query, form          │            │  Service Bus publish,             │
│  validation, export         │            │  job status polling               │
└────────┬────────────────────┘            └───────────────┬─────────────────┘
         │                                                  │  KEDA trigger
┌────────▼──────────────────────────────────────────────────▼─────────────────┐
│  LAYER 6: CLASSIFICATION ENGINE                                              │
│  LangGraph 6-node pipeline — Harvest→Context→Retrieve→Policy→Classify→Route │
│  Hybrid Classifier — deterministic rules authoritative, LLM advisory        │
│  Async LLM pre-fetch — per-record _classify_one coroutine, Semaphore(20)    │
│  Progressive streaming — in-memory progress_store, records pushed on finish  │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │  SQLAlchemy (sync, WAL)
┌────────────────────────────▼────────────────────────────────────────────────┐
│  LAYER 7: DATA SERVICES  (Azure VNet — all on private endpoints)             │
│  PostgreSQL + pgvector  |  Blob Storage  |  Service Bus  |  Redis Cache      │
│  Cosmos DB (audit archive, append-only)                                      │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────────────┐
│  LAYER 8: PLATFORM SERVICES                                                  │
│  Key Vault  |  Container Registry  |  Entra ID  |  Monitor + App Insights   │
│  GitHub Actions CI/CD  |  Container Apps Jobs (cron)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 End-to-End Data Flow

**Interactive upload path:** A Finance admin uploads a file through the Next.js UI. The request travels through Azure Front Door (WAF inspection, SSL termination, CORS enforcement) to the FastAPI API container. FastAPI writes the raw file to Azure Blob Storage, creates an `IngestionJob` record in PostgreSQL with status `pending`, and publishes a Service Bus message containing the job ID and source type. It returns the job ID to the browser immediately: the upload endpoint is non-blocking by design. The Worker container, idle until this moment, receives the KEDA scale trigger from the Service Bus queue and starts a new replica. The Worker fetches the file from Blob, calls the appropriate connector (Excel or DOCX), runs the full async enrichment and classification pipeline, writes classified records to PostgreSQL, appends audit events, and marks the job complete. The frontend polls `GET /jobs/{id}` every two seconds and transitions from loading state to the classification view when the job status changes.

**Nightly batch path:** Azure Container Apps Jobs triggers the Worker container on a cron schedule (02:00 UTC). The Worker reads the connector manifest: a configuration file listing all registered connectors and their source configurations, and processes all employees for the configured time window without any user interaction. A run manifest is written to Blob Storage at the end of each run: records processed, classified, escalated, failed, and elapsed time per agent stage. Azure Monitor alert rules fire if the error rate exceeds five percent, the run duration exceeds four hours, or the Service Bus dead-letter queue depth goes above zero.

---

## 4. Container Architecture

### 4.1 Two-Container Design

The system deploys two containers with independent scaling axes. This separation is not incidental, it is a deliberate architectural decision that solves a fundamental tension in the workload profile.

The **`eac-api` container** runs FastAPI via `uvicorn` and handles all synchronous browser-facing requests: file upload initiation, job status polling, record retrieval, human overrides, audit trail queries, and form validation. It must be always available and responsive. It scales based on HTTP concurrent request count with a minimum of one replica and a maximum of ten. Response time matters here because a Finance Reviewer waiting for an audit query result measures latency in seconds.

The **`eac-worker` container** handles all classification work: receiving Service Bus messages, running the full async enrichment pipeline, and writing results to the database. It must handle batch bursts efficiently and cost nothing when idle. It uses KEDA to scale from zero replicas when the queue is empty to up to twenty replicas when jobs accumulate, with one replica added per five queued messages. The scale-to-zero behavior is critical: during the twelve to twenty hours per day when no batch runs are active, the worker costs exactly nothing. The nightly batch burst is handled by auto-scaling up, and the replicas terminate when the queue drains.

Combining these two responsibilities into a single container would force a compromise that satisfies neither requirement. A container sized for batch throughput would be over-provisioned for API serving. A container tuned for API latency would struggle to scale effectively for batch workloads. The separation also provides an important operational boundary: a slow or failed batch job cannot block the API container's HTTP response latency, because they are in different processes on different replicas.

Both containers use the **same Docker image**. The worker overrides the `CMD` directive in Container Apps configuration: no separate Dockerfile is needed. This is a deliberate choice that eliminates version skew: whatever connector logic, classifier code, or pipeline changes are deployed to the API container are automatically deployed to the worker container. There is no scenario where the API and worker are running different versions of the classification engine.

### 4.2 VNet Integration and Private Endpoints

The Container Apps Environment is deployed inside an Azure Virtual Network. This is the foundational security decision of the production architecture, and it has an important consequence: every data service, PostgreSQL, Blob Storage, Service Bus, Key Vault, Redis Cache, is accessed over a private endpoint, meaning a network interface inside the VNet assigned a private IP address. The public endpoints of these services are disabled at the Azure portal level.

The practical implication is that a credential leak, an API key or database password extracted from a running container, does not by itself grant access to the data. An attacker with valid credentials would still need to be inside the VNet to reach the service. This is defense in depth in its correct form: credentials are managed by Key Vault and pulled via managed identity (eliminating the credential file entirely), but the network security layer provides an independent defense that does not depend on credential hygiene.

---

## 5. Pluggable Connector Framework

### 5.1 The Connector Contract

The connector contract is the primary extensibility mechanism of the entire system. It is a formal interface that every data source, present or future, must implement. Once implemented, a new connector plugs into the system without any changes to the classification engine, the orchestrator, or the agent pipeline. The contract has three obligations.

**Schema conformance.** Every connector must produce records that conform to the `ActivityRecord` schema: a TypedDict specifying every field the classification engine can consume, their types, and which fields are required versus optional. A connector that cannot populate a required field must either derive it from available data or reject the record to the quarantine log with a specific, actionable error message. The engine never receives a record with a missing required field, the schema gate enforces this before the record enters the pipeline. This design means the engine can be written and tested with synthetic records, completely independently of any connector implementation.

**Idempotent extraction.** Running the same connector twice on the same source data must produce identical records. This is not just a nice property: it is a requirement for the audit trail. If a Finance reviewer questions a classification and asks for the run to be replayed with updated accounting rules, the reprocessing must start from the same records. Non-idempotent extraction, where re-reading the same source produces different records due to non-deterministic parsing or ordering, would make replay impossible and the audit trail incomplete. In practice, idempotency means that deterministic field name normalization, deterministic sort order, and deterministic value coercion are all required properties of every connector implementation.

**Audit provenance.** Every record carries three mandatory provenance fields: `_source` (a registered connector identifier string), `_sourceFileName` (the specific file path or API endpoint that produced the record), and `_key` (a deterministic identifier derived from the source, such as a hash of the employee ID and time window, that remains stable across reruns). These fields are written into the audit event for every classified record and make the audit trail complete: an auditor can always trace a classification back to the specific source file and the specific connector version that produced the input record.

### 5.2 Excel Connector

The Excel connector uses `openpyxl` to parse `EAC_Dataset.xlsx`. The first challenge is header normalization: column names in real-world workbooks are inconsistently formatted, different capitalizations, trailing spaces, underscores versus spaces, abbreviated versus full names. The connector applies a canonical name map that resolves all known variants to the standard field name. When a column header does not match any known variant, the connector logs a warning and maps it to the closest match using fuzzy string similarity, but does not fail silently, the mapping decision is recorded in the run manifest so the data owner can correct the source file.

Each row is validated against the `ActivityRecord` schema. Rows that fail validation are quarantined, written to the `quarantine_log` table in PostgreSQL with the specific validation error, the row number, and the source file name. Quarantined rows are not classified. The quarantine log is surfaced in the Data Sources view of the UI, giving the Finance admin actionable information to fix the source workbook before the next run.

In production, this connector connects to SharePoint Online via the Microsoft Graph API, reading workbooks from the survey distribution folder. Authentication uses a service principal with `Files.Read.All` scoped permission. The connector polls for new or modified workbooks on the configured refresh schedule, using the file's last-modified timestamp to avoid reprocessing unchanged files. The connector-to-engine interface is identical regardless of whether the file came from a local upload or a SharePoint read, the engine cannot distinguish them.

### 5.3 DOCX Form Connector

The form connector reads structured survey forms from a ZIP archive of `.docx` files. This connector presents a qualitatively different extraction challenge from the Excel connector, and it is worth explaining in detail because the form parsing methodology was a deliberate architectural choice among several alternatives.

The survey forms are Word documents written in natural-language prose. Each form contains 39 data fields across 8 sections. The fields are not in a table, not in form fields in the Word document model, and not consistently formatted across all forms, different engineers completed them in different ways, with different amounts of narrative context, different abbreviations, and different levels of detail. The extraction problem is fundamentally a structured information extraction problem over semi-structured natural language.

Four extraction approaches were considered. Full LLM extraction (sending the entire document text to GPT-4 and asking it to return a JSON object) was rejected because it would make the extraction confidence non-deterministic and unauditable, if the LLM misreads a field, there is no traceable explanation for why. A pure table-parsing approach was rejected because the forms do not consistently use tables. A template-based approach requiring exact field positions was rejected because the forms were manually authored and do not have consistent field positions. The chosen approach, a regex-anchored section parser with typed value normalization, balances automation with traceability: every extracted value can be traced to the specific regex pattern that captured it, and patterns are versioned alongside the connector.

The parsing runs in three layers. The first layer performs section detection: the 8 section boundaries are identified by matching paragraph heading styles (Word paragraph style names `Heading1` and `Heading2`) and by content pattern matching against the known section name list. Each section is delimited by its start header and the next detected header. The second layer runs field extraction within each section: for each of the 39 fields, a primary regex pattern anchored to the exact field label is applied to the section text, plus a set of fallback patterns covering known label variations. The third layer normalizes extracted values to their schema types: percentage strings in any of the formats `"75%"`, `"75 percent"`, `"0.75"`, or `"seventy-five"` are all normalized to the float `0.75`; date strings are parsed to ISO-8601; categorical values are matched against the canonical category list using Levenshtein distance of at most two to handle minor spelling variations.

Each extracted field carries an `_extraction_confidence` annotation: `1.0` for an exact primary pattern match with in-range value, `0.8` for a fallback pattern match, `0.6` for a value requiring coercion or truncation, and `0.0` for no match. The per-record extraction confidence is the mean across all 39 fields and is shown in the Form Extraction Validation view alongside the field-level comparison table. This design means extraction quality is measurable and improvable, when a pattern fails on a new form variant, the failure is visible and the pattern can be updated.

The ten extracted records are validated against the corresponding Excel rows by matching the `Engineer_ID` field extracted from the form against the Excel dataset. For each matched pair, every extractable field is compared: exact match for categorical fields, ±10% tolerance for numeric fields, ±1 day for date fields. The POC achieves 100% match rate on the 10 provided forms because the Excel dataset and the forms were generated from the same underlying data, validating that the three-layer extraction pipeline is correctly reading all 39 fields.

**Scaling to hundreds of forms.** The regex parser scales linearly with form count and runs in milliseconds per form. However, it is brittle to template changes: if the survey form is revised: new sections added, fields renamed, question order changed, the regex patterns must be updated. For the POC with a stable form template, this is acceptable. For production handling hundreds of forms from multiple template versions, the production path is Azure Document Intelligence (Form Recognizer) trained on labeled examples of the survey form layout. Document Intelligence handles OCR for scanned or photographed paper forms, layout variation across form template versions, high-volume parallel processing (up to 500 pages per API request, fully async), and automatic retraining when new form variants are identified. The connector contract does not change when Document Intelligence is adopted, its output is mapped to the same `ActivityRecord` schema by the same normalizer layer. Adopting Document Intelligence is purely an internal connector implementation change.

---

## 6. Data Enrichment Pipeline

The enrichment pipeline transforms raw connector records into classification-ready inputs. It has seven stages. Each stage is independently testable, produces structured output that the next stage validates, and has a defined failure mode that does not block subsequent records.

### Stage 1: Raw Ingestion

The connector extracts records from the source system and deposits them into a staging area, Azure Blob Storage in production, a local temp directory in the POC. Each record at this stage is in the connector's native format: an Excel row dictionary or a DOCX extracted field map. No classification logic has run yet. The record is as close to the source data as possible at this point, which makes it suitable for auditing source fidelity, if a question arises later about whether the classification was based on correct input data, the staged record can be compared against the source document.

At enterprise scale, processing 100,000 employees from multiple connectors, the raw ingestion stage runs as a parallel fan-out. Each registered connector runs concurrently; a connector failure does not block other connectors. Records from each connector are chunked into batches of 100 before entering the downstream stages. The Blob Storage staging area acts as a durable buffer between extraction and processing: if the downstream pipeline fails, the staged records can be reprocessed without re-running the connectors. This decoupling of extraction from processing is what makes the overnight batch replay-safe.

### Stage 2: Schema Normalization

The normalizer maps connector-native field names to the canonical `ActivityRecord` schema. This is the point at which the connector's idiosyncrasy ends, after normalization, the record is indistinguishable from a record produced by any other connector. The normalizer applies type coercion (string to float for spend amounts, percentage strings to decimal fractions), null propagation rules (required fields that are null after coercion fail validation; optional fields carry forward as null with a notation in the record's audit provenance), and deterministic ordering of all fields to ensure idempotency.

The normalization step is CPU-bound and embarrassingly parallel, each record is normalized independently in microseconds. At scale, this stage adds negligible time to the pipeline. Its importance is architectural rather than computational: by enforcing schema conformance at this stage, every subsequent stage can assume it is operating on a well-typed, fully-specified record.

### Stage 3: Quarantine Gate

Every record passes through a quarantine check after normalization. Records fail the quarantine check on three grounds: missing mandatory fields that could not be derived from available data, field values outside defined ranges (for example, `CapEx_Eligible_Pct` outside 0–100, `Hours_Logged` negative, or `ActualSpend_USD` non-numeric), or structural inconsistency between related fields (for example, `Hours_Logged` equal to zero alongside a non-zero `ActualSpend_USD`, which suggests a data entry error in the source).

Quarantined records are written to the `quarantine_log` table in PostgreSQL with the specific validation error, the record key, and the source file name. They do not enter the classification pipeline. The quarantine log is surfaced in the UI so the data owner can fix the source data before the next run.

The design choice to quarantine rather than impute is deliberate and has an important accounting rationale. Imputing missing values for financial classification data introduces synthetic inputs that have no grounding in actual observed activity. An auditor asking "why was this record classified as CapEx?" must be able to trace back to real source data. If the evidence trail cites an imputed value, "hours logged was estimated as 160 because the employee's job family average is 160 hours per quarter", the classification is no longer defensible in the same way. Imputation obscures the quality of the underlying data and makes the system appear more confident than it has grounds to be. Quarantining bad records and requiring the data owner to fix them at the source produces a cleaner dataset over time and maintains the integrity of the audit trail.

### Stage 4: HR Context Injection

Each normalized record is enriched with HR profile context: `hr_job_title`, `hr_job_family`, `hr_org_unit`, `hr_department`, `hr_cost_centre`, `hr_seniority`, `hr_employee_type`, and `hr_location`. This enrichment is critical because the same observable activity means something different depending on who performed it. A network engineer performing "system configuration" activities has a substantially different capital classification profile than an IT help desk technician performing a task labeled the same way. Without HR context, the signal engine cannot apply persona-specific rules, and the confidence scores will be systematically miscalibrated for activity types that are capital-qualifying for some job families but not others.

In the POC, HR profile data is derived from fields already present in the Excel dataset, job title, team, and cost class fields, augmented with simulated values for fields that are not provided. The simulation is not arbitrary: it is calibrated to be consistent with the network engineering persona described in the use case requirements, so that the classification output is representative of what a production system would produce for this employee population.

In production, HR profile data is pre-loaded into the PostgreSQL `hr_profiles` table on the nightly HR connector refresh cycle (at minimum once per twenty-four hours, as specified in the data requirements). The enrichment at this stage is a database lookup by employee ID, not a live call to the HR system API. This is a deliberate architectural choice. Making live HR API calls during the classification pipeline would introduce two risks: the HR system's availability and rate limits become dependencies of the batch run, and any latency in the HR API directly multiplies across the full employee population. By pre-loading HR data into the local database, the classification pipeline is decoupled from the HR system entirely. The HR connector runs on its own schedule and handles its own retry logic.

### Stage 5: Signal Extraction and Weighting

The accounting rules engine evaluates each enriched record against fourteen weighted signals and computes a raw classification score. The signals are organized into three tiers based on their evidential weight in the accounting analysis.

**Tier 1: Direct evidence (weight coefficient 2.0):** These signals correspond to facts that directly satisfy the accounting test for capital treatment. Activity type matches an explicitly capital-qualifying category; the VZZ_CostClass code from the ERP indicates capital treatment; VZZ_WorkType indicates a build activity rather than maintenance; the associated project is in an active build or deployment phase. When these signals fire, they provide strong evidence of capital treatment because they reflect explicit classifications made at the source: the ERP system, the project management system, or the activity taxonomy already encode accounting intent.

**Tier 2: Supporting evidence (weight coefficient 1.0):** These signals are consistent with capital treatment but are not individually sufficient. CapEx_Eligible_Pct at or above the configured threshold indicates the activity was designed to be partially capital; Asset_Life_Years at or above the threshold indicates the associated asset qualifies for long-lived treatment; Milestones_Completed above zero indicates the employee completed deliverables on a build project; DriveTests_Completed above zero is a network-domain specific signal indicating new infrastructure commissioning activity, which qualifies for capitalization under the network engineering persona rules.

**Tier 3: Contextual evidence (weight coefficient 0.5):** These signals adjust the confidence score based on the plausibility of capital treatment given the broader context. HR job family in the capital-eligible list (network engineering, infrastructure build) increases the prior probability of capital treatment. Seniority level consistent with capital project leadership is a supporting contextual signal. ActualSpend_USD above the materiality threshold and Hours_Logged above the minimum are necessary but not sufficient conditions. Team type and quarterly activity pattern contribute marginal additional context.

Signals fire in both directions. For every capital-indicating signal, there is a corresponding expense-indicating counterpart: activity type in the explicit expense-only list fires the OpEx signal at tier-1 weight in the opposite direction. The raw score is the sum of all CapEx signal weights minus the sum of all OpEx signal weights, normalized to a range of negative one hundred to positive one hundred. A sigmoid function maps this score to a zero-to-one-hundred confidence value calibrated against historical survey data: for a given raw signal score, the confidence percentage reflects the historical agreement rate between engine-produced classifications and domain expert review.

### Stage 6: LLM Context Enrichment (Advisory Layer)

This stage runs asynchronously for all records concurrently. Each record is wrapped in a `_classify_one` async coroutine that awaits a single `prefetch_llm` call, then immediately runs the synchronous LangGraph pipeline and persists the result, all within the same coroutine. All coroutines are launched together via `asyncio.gather`; a shared `asyncio.Semaphore(LLM_CONCURRENCY, default 20)` caps the number of in-flight Azure OpenAI calls at any moment. Each record's enriched context is sent to Azure OpenAI in a single combined prompt that requests six outputs simultaneously: investment signals (cues from the record text suggesting capital investment context), organizational context (enriched description of the organizational setting and its relevance to capital classification), classification hints (signals not captured by the rule engine), similar historical patterns (precedents the LLM recognizes from its training), a policy verdict (the LLM's assessment of whether GAAP ASC 350-40 or IAS 16 applies to this specific activity), and an evidence note (a human-readable explanation of the classification rationale that will be shown to the Finance Reviewer).

A critical design constraint governs how the LLM output is used: it is **advisory only**. The LLM's policy verdict and classification hints are incorporated into the confidence score calculation as a bounded adjustment: at most plus or minus twenty confidence points. The LLM cannot change a deterministic CapEx classification to OpEx or vice versa; it can only adjust the confidence score and enrich the evidence note. The final CapEx/OpEx/Review verdict is always the output of the deterministic rules engine. This design constraint exists for two reasons. First, audit defensibility: the classification must be explainable by citing specific signals and the rules that were applied to them, not by referencing a language model's reasoning. Second, model version risk: Azure OpenAI deploys model updates on a rolling basis, and a model update could silently change the LLM's assessment of a record with no change to the source data. If the LLM owned the final verdict, this would mean retroactive changes to classifications that were already produced, audited, and submitted. By keeping the final verdict in the deterministic rules engine, the classification is pinned to the rule version, not the model version.

The LLM skip threshold addresses cost at scale. Records where the deterministic confidence score already equals or exceeds the configured threshold (production default 85) bypass the LLM call entirely. The evidence note for these records is assembled directly from the signal ledger. In a typical clean dataset, approximately seventy percent of records are classified with deterministic confidence above 85, reducing Azure OpenAI API calls by roughly seventy percent with no impact on classification accuracy. The skip logic is a configuration parameter per persona, an audit-sensitive persona can lower the threshold to 70, ensuring LLM enrichment on all borderline records; a high-volume persona with highly predictable signal patterns can raise it to 92, minimizing API cost.

### Stage 7: Classification and Persistence

Within each `_classify_one` coroutine, the synchronous LangGraph pipeline runs immediately after the LLM call resolves, reading the pre-fetched result from the `precomputed_llm` state field. The graph makes no additional I/O calls; all data it needs is already in the state object. Once the graph completes, the record is persisted to the database and pushed to the in-memory `progress_store` (see Section 7.4) — making it visible to the frontend before any other record's processing is complete.

Each classified record is written to the `activity_records` table in PostgreSQL. A corresponding audit event is appended to the `audit_events` table, and eventually to Azure Cosmos DB in the production write path, capturing the full classification context: input signals, rule version, LLM provider and model, confidence score, final classification, routing decision, evidence note, and the complete agent pipeline trace. Neither the record nor the audit event is ever updated after initial write; they are immutable. Human overrides create new audit events that reference the original by event ID.

---

## 7. LangGraph Agentic Pipeline

### 7.1 Six-Node Architecture

The LangGraph pipeline implements a directed acyclic graph of six nodes. Each node receives the full `EACAgentState` TypedDict and returns a partial state update, only the fields it is responsible for. This immutability constraint means no node can overwrite another node's output, and each node can be tested in isolation with a synthetic state object.

**Node 1: Harvesting Agent.** Validates the record structure, injects HR context from the pre-loaded HR profile table, runs the accounting rules engine to compute the initial signal score and confidence, and produces the enriched record dict that all downstream nodes will read. This is the only node that calls the database during graph execution; all other nodes operate on the state object already in memory.

**Node 2: Context Enrichment Agent.** The LLM integration point. When the orchestrator has run the async pre-fetch (the normal batch path), this node reads directly from `precomputed_llm` without making any API call. When running in single-record mode (test path or interactive override classification), it falls back to a synchronous Azure OpenAI call. All six LLM output fields are stored in the `context` state dict under namespaced keys. Downstream nodes read from context: they do not call the LLM directly. This means the LLM is invoked exactly once per record regardless of how many downstream nodes consume its output.

**Node 3: Semantic Retrieval Agent.** Reads the pre-computed similar patterns and precedent classification from the context dict. In production, this node queries Azure AI Search using an OpenAI embedding of the current record's activity description to find the k nearest historical classifications and their evidence trails. These precedents are passed to the Classification node as few-shot context: "these five similar activities were all classified as CapEx for these reasons." In the POC, the LLM provides simulated precedents as part of its combined response.

**Node 4: Policy Evaluation Agent.** Reads the pre-computed GAAP/IAS 16 policy verdict and applicable rule citations from the context dict. The policy node is the formal compliance gate: even if the signal ledger strongly indicates CapEx, the policy node can override the routing to Review if the applicable accounting rule specifically excludes this activity type. The most common case for this override is software development activities in the preliminary project stage, which explicitly do not qualify for capitalization under ASC 350-40 even if all other signals are positive.

**Node 5: Classification Agent.** Calls the hybrid classifier with the fully enriched context. The classifier applies the deterministic rules to produce the final CapEx/OpEx/Review verdict with confidence score, complete signal ledger, and evidence note. The LLM's policy rationale and evidence note are incorporated into the final evidence trail visible to the Finance Reviewer, but they do not change the deterministic verdict: they are annotations on a decision that was already made.

**Node 6: Routing Agent.** Evaluates the final confidence score against the review threshold (default 68, configurable per persona). High-confidence records are routed to the output queue: they will be visible to the employee as their pre-populated survey response. Low-confidence records are routed to the Domain Lead escalation queue, they will not be visible to the employee until a Domain Lead reviews and resolves them. This asymmetric routing is a compliance requirement, not a UX preference: per the system design constraints, low-confidence classifications must never reach employees directly.

### 7.2 Multi-Model Routing Strategy

Using a single LLM model for every record is a blunt instrument that produces either unnecessary cost (using a powerful model for simple records) or unnecessary inaccuracy (using a cheap model for genuinely complex records). The production architecture uses a tiered model routing strategy where model selection is a function of the deterministic confidence score and the task type.

**Tier 0: No LLM (deterministic skip).** When `det_confidence >= LLM_SKIP_THRESHOLD`, the LLM call is bypassed. The evidence note is assembled from the signal ledger. This covers approximately 70% of a clean dataset at the production default threshold of 85.

**Tier 1: gpt-5.5 (routine enrichment).** Applied when confidence is in the range 55–84. Fast, inexpensive, and adequate for generating the policy rationale and evidence note for records that are not ambiguous: the deterministic rules have already produced a confident-enough verdict that the LLM's role is primarily to explain it in plain language.

**Tier 2: gpt-5.5 (complex reasoning).** Applied when confidence falls below 55: the signal ledger is genuinely inconclusive. These are the records most likely to be escalated to human review, and the quality of the evidence note matters most here. gpt-5.5 produces more nuanced policy rationale for edge cases: software in ambiguous development stages, maintenance activities that have incidental capital benefit, activities that partially qualify under IAS 16 but not ASC 350-40.

**Tier 3: text-embedding-3-small (semantic retrieval).** Not a generative call: used to embed the activity description for vector similarity search against the historical classification store in Azure AI Search. Called once per record that enters the semantic retrieval node.

**Tier 4: Fine-tuned model (Year 2+).** After accumulating 10,000+ validated classification examples, a fine-tuned variant trained specifically on EAC classification inputs and outputs replaces Tier 1 for routine records. Approximately 80% cost reduction; improved consistency on organization-specific activity vocabulary.

Model tier is a per-persona configuration parameter. The routing logic is a single function call in the orchestrator, not a code change when the tier boundaries are adjusted.

### 7.3 Two Processing Modes: POC Streaming vs. Production Batch

The orchestrator supports two distinct processing strategies. The correct choice depends on whether a human is watching the UI:

**POC / interactive upload (current implementation).** A Finance admin uploads a file and watches records appear in real time. Each record runs through a `_classify_one` async coroutine that: (1) awaits the LLM pre-fetch call; (2) runs the synchronous LangGraph pipeline immediately once the result is available; (3) persists the record and pushes it to the in-memory progress store. All coroutines are launched concurrently via `asyncio.gather`; a `asyncio.Semaphore(LLM_CONCURRENCY)` bounds in-flight LLM calls. Records stream into the UI one by one as their individual LLM calls return — typically 3–10 seconds of latency before the first record appears, with the full 148-record set completing in 15–30 seconds. The SQLAlchemy session remains synchronous and is never touched by the async event loop.

**Production nightly batch (target architecture).** No human is watching the UI during a 02:00 UTC batch run, so per-record streaming adds no value. The batch worker uses chunk-based processing: LLM calls for a chunk of 100 records are pre-fetched concurrently (`asyncio.gather` + semaphore), then when all 100 results are in memory, the synchronous LangGraph pipeline runs for each record in sequence, and all 100 rows are bulk-inserted in a single commit. This yields better database throughput (fewer round-trips), simpler event loop management, and compatibility with multi-replica worker deployments — the in-memory progress store is process-local and does not work across KEDA-scaled worker replicas.

LangGraph's `invoke()` is synchronous by design. Both modes avoid the complexity of a thread pool with shared SQLAlchemy sessions by keeping all database writes in the synchronous phase, after the async LLM gather completes.

### 7.4 In-Memory Progress Store (POC)

The POC interactive path uses an in-memory store (`app/state/progress_store.py`) as the intermediary between the orchestrator and the frontend polling loop. This is a POC-specific design; production uses the database directly after the batch run completes.

**Why the database cannot serve progressive results during processing.** The SQLAlchemy session accumulates writes that are committed in bulk. A second session used by the API polling endpoint cannot see uncommitted data from the orchestrator's in-flight transaction, due to read-committed isolation in both SQLite WAL and PostgreSQL. The in-memory store bypasses this: it is written the moment each record is classified, before any DB commit, and read without any transaction boundary.

**Design.** `progress_store.py` is a module-level dict guarded by a `threading.Lock`. The orchestrator calls `progress_store.push(run_id, [record])` after each record completes. The API endpoint `GET /api/records/run/{run_id}?offset=N` returns only the records the frontend has not yet seen. The frontend polls every 500 ms during processing.

**Production replacement.** The in-memory store is process-local and incompatible with multi-replica deployments. In production the batch worker writes results to the database in bulk; the frontend loads the completed run from `GET /api/records` after the job status transitions to `completed`. If real-time progress reporting were required in production, the `push`/`get` interface is narrow enough to be backed by a Redis list with no orchestrator changes.

---

## 8. CapEx / OpEx Classification Logic

### 8.1 Accounting Framework

The classification engine applies GAAP ASC 350-40 (internal-use software) and IAS 16 (property, plant, and equipment). Both standards share a common logical structure: capital treatment is appropriate when an activity creates or substantially enhances a long-lived asset, when that asset will generate future economic benefit, and when the cost can be reliably measured and is above the organization's materiality threshold.

Under ASC 350-40, software development labor qualifies for capitalization only during the application development stage, the stage at which the organization has committed to development, the technological feasibility of the project is established, and active development of the new functionality is underway. Labor during the preliminary project stage (research, feasibility assessment, evaluation of alternatives) does not qualify. Labor during the post-implementation stage (training, minor bug fixes, maintenance) does not qualify. The boundary between stages is not always obvious from observable signals alone, which is part of why the LLM policy evaluation node exists: to flag records where the activity description is consistent with both a qualifying and a non-qualifying stage, and route them to human review rather than classifying them with false confidence.

Under IAS 16, the capital treatment test is whether the labor is directly attributable to bringing the asset to working condition for its intended use. This is a broader and in some ways simpler test than ASC 350-40 for physical infrastructure: a network engineer performing a drive test to commission a new cell site is clearly performing labor that brings the asset to its intended working condition. The challenge is that many activities are partially attributable, a senior engineer who spends part of their time in project leadership (capital) and part in operations (expense) must have their time split appropriately. The persona configuration for the network engineering job family includes specific split rules for mixed-activity job families.

### 8.2 Signal Ledger and Confidence Scoring

The fourteen signals described in Section 6, Stage 5 are organized into three tiers with weight coefficients of 2.0, 1.0, and 0.5 respectively. The raw score is the algebraic sum of all firing signal weights (positive for CapEx signals, negative for OpEx signals), normalized to the range [-100, +100]. A calibrated sigmoid function maps this score to a 0–100 confidence value. The calibration is fit against historical survey data: for a given raw signal score, the confidence percentage reflects the empirical agreement rate between engine-produced classifications and domain expert review on labeled historical data.

The classification threshold produces three outcomes: raw score ≥ +20 (confidence ≥ 68) maps to CapEx; raw score ≤ -20 maps to OpEx; |score| < 20 maps to Review. All three threshold values are persona configuration parameters, the default of 68 for the review threshold was calibrated on the provided network engineering dataset and may need adjustment for other employee populations with different signal distributions.

---

## 9. Audit Trail Design

### 9.1 Production Architecture on Azure

The audit trail design must satisfy two requirements that pull in opposite directions: it must be append-only and tamper-evident (for compliance and legal defensibility), and it must be efficiently queryable (for the Finance Reviewer UI and ad-hoc audit queries). The production architecture on Azure resolves this by separating the write path from the read path.

The **write path** uses Azure Cosmos DB configured with append-only permissions on the application service principal. The service principal has `Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/create` permission, but no update or delete permissions. Every audit event is written as an immutable document carrying a `SHA-256` content hash computed over all non-hash fields. The Cosmos DB account is configured with continuous backup (30-day point-in-time recovery) and geo-redundancy. This combination: append-only permissions, content hashing, continuous backup, and geo-redundancy, provides WORM-equivalent compliance posture without the additional cost of dedicated WORM storage.

The **read path** uses a PostgreSQL mirror table maintained by an Azure Function triggered by the Cosmos DB change feed. The change feed processor writes each new audit event to the PostgreSQL mirror, adding join keys for efficient querying by employee ID, job ID, record key, time range, and classification type. The Finance Reviewer UI queries the PostgreSQL mirror: fast indexed queries, rather than querying Cosmos DB directly. This architectural separation means audit write performance is not affected by query load, and query performance is not affected by write throughput during a batch run.

### 9.2 Override Chain

When a Finance Reviewer overrides a classification, a new audit event of type `override` is created. It references the original classification event by `event_id` and records the reviewer's Entra ID identity, the reason provided, the old classification, and the new classification. The original event is never modified. The authoritative classification for a record is the most recent non-voided event in the chain ordered by timestamp. This append-only override chain provides full correction history, preserves the original machine classification for model quality measurement (the conflict rate metric counts original-vs-override disagreements), and is fully auditable, an auditor can see every classification, every override, who made it, and when.

---

## 10. Security Architecture

**Identity and access control.** Azure Entra ID provides authentication for all user-facing access. The Next.js frontend uses MSAL for browser-side OIDC. FastAPI validates Bearer tokens against the Entra JWKS endpoint on every authenticated request. Three role groups are defined: Finance Reviewer (read all records and audit events, export reports, cannot modify configuration), Domain Lead (read and override records for their organizational unit only, access the review queue for their team), Platform Admin (full access including connector management, rule version promotion, persona configuration). Managed identities are assigned to both container apps with the minimum required permissions: the API container managed identity has `get` permission on specific Key Vault secrets and read/write on the assigned database schema; the worker container has `get` on LLM API key, storage account key, and database connection string.

**Network security.** The Container Apps Environment is VNet-deployed. Private endpoints serve PostgreSQL, Blob Storage, Service Bus, Key Vault, and Cosmos DB: their public endpoints are disabled. Azure Front Door with WAF (OWASP 3.2 ruleset, rate limiting rules) fronts the API container's public ingress. The worker container has no public ingress at all. A credential leak cannot grant data access without VNet membership.

---

## 11. Observability

**Distributed tracing.** Application Insights is configured in both containers. The LangGraph `steps` list maps directly to distributed trace spans: each of the six nodes creates a custom span with name, status, duration, LLM provider, and token count where applicable. The full trace for a single record classification: HTTP upload through Service Bus through Orchestrator through LangGraph through database write, is visible as a single distributed trace in the Application Insights Application Map. This is particularly valuable for diagnosing latency: if a nightly batch is slow, the trace shows exactly which records spent time in the Context Enrichment node (LLM call), which Azure OpenAI deployment was used, and what the token counts per call were.

**Structured logging.** Every log line carries structured fields: `job_id`, `record_key`, `agent`, `classification`, `confidence`, `llm_provider`, `llm_model`, `duration_ms`, `rule_version`. Logs flow to Log Analytics Workspace via the Container Apps log drain. Finance reviewers and auditors can run KQL queries to answer audit questions: which records were classified by which rule version, what the distribution of confidence scores was across a batch run, what the conflict rate was for a given employee population.

**Alerts.** Azure Monitor alert rules fire on: batch run duration exceeding four hours, error rate above five percent of records quarantined in a single run, LLM API failure rate above ten percent (triggers automatic fallback to stub mode with deterministic-only classification), and Service Bus dead-letter queue depth above zero, which indicates a job processing failure requiring manual intervention.

---

## 12. Stubs Inventory: Production Replacements

Every stub in the current POC has a defined production replacement path. The table below documents all thirteen stubbed components.

| Stub | POC Behavior | Production Replacement | Azure Service |
|---|---|---|---|
| HR profile data | Derived from Excel fields + simulated values | SAP SuccessFactors API or Workday RaaS | Azure API Management proxying HR API |
| Investment / funding context | Hardcoded from workbook fields | SAP / Oracle capital project data | Azure Integration Services |
| Semantic precedent retrieval | LLM-simulated similar patterns | Vector index over historical classifications | Azure AI Search + OpenAI embeddings |
| Historical labeled data | Simulated from provided dataset | Previous survey cycles, labeled store | PostgreSQL historical table + AI Search |
| File staging | Local tmp directory | Blob Storage container + lifecycle policy | Azure Blob Storage |
| Job queue | Background Python thread | Service Bus Premium queue | Azure Service Bus + KEDA |
| Relational database | SQLite WAL | PostgreSQL Flexible Server | Azure Database for PostgreSQL |
| Audit archive | SQLite audit_events table | Append-only Cosmos DB + change feed mirror | Azure Cosmos DB |
| Authentication | None (dev mode) | Entra ID OIDC | MSAL + Bearer token validation |
| LLM rate limiting | asyncio.Semaphore(20) in-process | Azure OpenAI PTU + APIM rate limit policy | Azure API Management |
| CORS policy | FastAPI middleware + `allow_origin_regex` for `*.vercel.app` | Front Door WAF policy | Azure Front Door |
| CI/CD | Manual file copy | GitHub Actions → ACR → Container Apps | GitHub Actions + ACR |
| Form extraction | Regex parser | Azure Document Intelligence trained model | Azure Document Intelligence |

---

## 13. Key Design Decisions

### Decision 1: Azure Container Apps over AKS

The choice between Container Apps and AKS is fundamentally a question of operational scope. AKS provides the most control: custom node selectors, GPU node pools, cluster-level networking plugins, custom admission webhooks, and the full Kubernetes API surface. For a batch classification workload with no specialized per-node requirements, none of these controls are needed, and the operational overhead, cluster upgrades, node pool management, networking plugin configuration, RBAC at the Kubernetes API level, would consume engineering time that does not improve the system.

Azure Container Apps provides managed Kubernetes under the hood with KEDA scaling built in and VNet integration available as a first-class configuration option. The worker container's scale-to-zero behavior is the critical requirement, and it is implemented with a single YAML configuration block in Container Apps. Azure Functions was considered for the API layer but rejected: the LangGraph pipeline is a long-running stateful execution that can take thirty to sixty seconds for a batch of one hundred records, which exceeds the Functions consumption plan timeout and requires careful configuration even on premium plans. Container Apps handles this naturally with no timeout constraints.

The tradeoff accepted with Container Apps is reduced visibility into the underlying Kubernetes cluster and no ability to schedule workloads on specific node types. For this workload, neither constraint is binding. If the system were to evolve toward GPU-accelerated embedding generation or fine-tuning workloads, AKS would become the correct choice. Container Apps does not support GPU node pools. The architecture does not foreclose that migration because the containerization strategy is the same either way.

### Decision 2: Deterministic Rules as Classification Authority, LLM Advisory

The relationship between the deterministic rules engine and the LLM is one of the most consequential architectural decisions in the system. Two alternative architectures were seriously considered before the hybrid approach was chosen.

A pure LLM approach, using GPT-4 to make the classification decision based on the full record context, produces fluent, nuanced evidence notes and handles edge cases with apparent sophistication. The problem is threefold. First, model version risk: Azure OpenAI deploys model updates that can change classification behavior without any change to the source data or the prompt. A record classified as CapEx in May 2025 might be classified differently in October 2025 not because anything changed about the activity, but because the model improved in ways that affected its accounting judgment. For financial reporting, this is unacceptable, historical classifications must be stable and tied to a pinned, versioned artifact. Second, the LLM cannot cite signals: it can say "this looks like a capital activity because of the project context," but it cannot say "signal_capex_activity_type fired at weight 2.0 and signal_capex_project_status fired at weight 2.0." The signal ledger provides the auditor with specific, verifiable facts; the LLM provides an interpretation. Third, the LLM overstates its confidence on ambiguous records, producing plausible-sounding classifications where the correct answer is "this needs human review." The deterministic confidence scoring routes these records appropriately; an LLM-primary system would surface them to employees with false confidence.

A pure rule-based approach eliminates model version risk and produces fully traceable classifications, but generates terse, technical evidence notes, "Activity_Type: Build Milestone, CapEx_Eligible_Pct: 0.75, Project_Status: Active Build", that Finance Reviewers and employees find difficult to parse and act on. The LLM's contribution in the hybrid model is specifically the human-readable explanation layer: it takes the signal ledger output and translates it into a paragraph that a non-accountant can read and understand.

The hybrid approach separates these two concerns cleanly: the deterministic engine makes the decision, the LLM explains it. An auditor inspects the signal ledger; a Finance Reviewer reads the evidence note. Neither layer depends on the other being correct for the system to function, if the LLM produces a poor evidence note, the classification is still correct; if the LLM is unavailable, the stub mode produces a signal-ledger-derived evidence note that is less polished but equally accurate.

### Decision 3: Single Combined LLM Call per Record

The original pipeline design made four sequential LLM calls per record: one for context enrichment, one for retrieval, one for policy evaluation, and one for evidence generation. Each call was approximately 600ms with `gpt-5.5` at low concurrency. At 148 records, this produced 592 sequential API calls taking over two minutes in total, which exceeded the frontend polling timeout of 180 seconds.

Combining all four outputs into a single structured prompt reduced the call count to 148, enabled full parallel pre-fetch, and brought the total processing time for 148 records to fifteen to thirty seconds. The quality of the combined call is equivalent to the four sequential calls because the LLM processes all context simultaneously, the investment signals, org context, policy verdict, and evidence note are not independent enough to require separate context windows. In fact, the combined call can be better: the LLM's evidence note can reference the policy verdict it produced in the same response, producing a more coherent explanation than would be possible when policy and evidence are generated in separate calls.

The tradeoff is a larger input token count per call, approximately 1,500 tokens per combined call versus 400 tokens per individual call. At the output token limit of 500 tokens, the combined response is bounded and the cost increase is approximately 3× per call rather than 4×. The net result is a 75% reduction in API calls and a 25% reduction in total token cost.

### Decision 4: Processing Strategy — Per-Record Streaming (POC) vs. Chunk-Based Batch (Production)

Two processing strategies exist for the async-then-sync pipeline. The choice is driven by whether a human is watching the UI.

**Per-record streaming (POC interactive path).** Each record runs through a `_classify_one` coroutine: await LLM → run LangGraph → persist → push to progress store. Records appear in the UI one by one as their LLM calls return. This is the right model when a Finance admin has uploaded a file and is actively watching the dashboard. The cost is more frequent, smaller DB writes (one commit per record rather than one per chunk).

**Chunk-based batch (production nightly path).** All LLM calls for a chunk of 100 records are pre-fetched concurrently before any LangGraph execution begins. When the pre-fetch gather completes, all 100 results are in memory and the LangGraph pipeline runs for each record sequentially. The 100 rows are bulk-inserted in a single commit. This is the right model for the overnight batch: no one is watching the UI, multi-replica KEDA workers make the in-memory progress store unworkable, and bulk inserts are significantly more efficient at scale.

Both strategies keep the SQLAlchemy session synchronous and never shared across coroutines or threads. In both cases, the `asyncio.Semaphore(LLM_CONCURRENCY)` bounds the number of concurrent Azure OpenAI calls.

### Decision 5: PostgreSQL + pgvector over Dedicated Vector Store

The system has three distinct data needs from its persistence layer: relational queries for record retrieval and reporting, vector similarity search for semantic precedent retrieval, and transactional audit writes that must be atomic with the classified record write. Splitting these across a relational database and a dedicated vector store (Pinecone, Weaviate, Qdrant, or Azure AI Search) creates a distributed consistency problem: if the relational write succeeds but the vector index update fails, the audit trail references a record that is not in the precedent store; if the vector write succeeds but the relational write fails, there is a dangling vector with no corresponding record.

PostgreSQL with the pgvector extension collapses all three needs into a single database with full ACID transactional semantics. The classified record write, the audit event append, and the embedding vector upsert all happen in a single transaction. Either all three succeed or none do. The tradeoff is query performance at very large vector scale: pgvector's approximate nearest-neighbor search is slower than a dedicated vector store at tens of millions of vectors or more. For this use case, a few hundred thousand historical classifications at production scale, pgvector's performance is entirely adequate and the simplicity of a single database is well worth the performance headroom being left on the table.

### Decision 6: Multi-Model Routing over Single-Model Uniformity

Using `gpt-5.5` for every record would maximize evidence note quality but at approximately four times the cost of `gpt-5.5`. Using `gpt-5.5` for every record would reduce cost but apply inadequate reasoning power to the genuinely ambiguous records that carry the highest audit risk. Neither is optimal.

The tiered routing approach applies model selection as a function of deterministic confidence: records where the signal ledger is already highly confident receive the lightweight model for evidence note generation; records where the signal ledger is genuinely inconclusive receive the more capable model for policy reasoning. This is the correct assignment of model capability to task difficulty, and it is how a human expert would approach the same workload, routine cases get efficient processing; edge cases get careful attention.

The configuration-driven routing means a persona with stricter compliance requirements can lower the Tier 2 threshold to 45, ensuring the full model is applied to any record with meaningful ambiguity. A high-volume, low-complexity persona can raise the skip threshold to 92, eliminating LLM calls for nearly all records. Neither adjustment requires a code change.

### Decision 7: Signal Weight Learning over Pure LLM Classification

The signal weights in the current system are hand-crafted based on the engineering team's understanding of the GAAP/IAS 16 tests and the network engineering persona. They are reasonable starting points, but they encode the team's prior beliefs rather than empirical evidence about what signals are actually most predictive.

Over time, as human overrides accumulate, the system has the data to test those beliefs. A logistic regression fit against the override dataset will produce empirically calibrated weight coefficients that reflect actual domain expert judgment rather than engineering intuition. These learned weights are promoted through the Finance SME governance workflow as a new rule version, the same process used for any rule change, so the update is human-approved and version-controlled.

The alternative, replacing the weight-based signal ledger with a neural classifier trained on the same data, produces a model that is empirically calibrated in the same sense but loses the interpretability of the individual signal weights. An auditor who wants to understand why a record was classified as CapEx can read the signal ledger and understand each contributing factor. A gradient boosting or neural classifier produces a score, not a traceable chain of evidence. For financial reporting, the interpretability of the signal ledger is worth the marginal accuracy gain of a more complex model.

---

## 14. Continual Learning Roadmap

### 14.1 Why the System Can Learn Over Time

The system generates its own training data automatically. Every human override, a Finance Reviewer or Domain Lead correcting a machine classification, is a labeled example: here is the record, here are the signals, here is the wrong classification the engine produced, here is the correct one. The system persists every override as an audit event. The conflict rate metric (corrections as a percentage of total classifications) tracks how often the engine disagrees with domain experts and whether that rate improves or degrades over survey cycles. The architecture was designed with this accumulation in mind, it is not an afterthought.

### 14.2 Three Learning Layers

**Layer A: Signal weight recalibration (Year 1, after approximately 500 overrides).** This is the highest-value, lowest-risk learning intervention. The fourteen binary signals are used as features in a logistic regression fit against the accumulated override dataset. The learned weight coefficients replace the hand-crafted ones as a new rule version: promoted through the Finance SME governance workflow before taking effect. The entire recalibration is an offline job that takes minutes. The output is interpretable: weight coefficients that a non-technical Finance SME can review and understand. "The model now weights milestone completion 2.4× as heavily as before because the data shows it is a stronger predictor of capital treatment than originally estimated" is an auditable statement that can be placed in the rule change documentation.

**Layer B: RAG-based precedent retrieval (Year 1, continuous).** As records are validated and confirmed, each is embedded using the text-embedding-3-small model and added to the Azure AI Search vector index. The Semantic Retrieval node (Node 3 in the LangGraph pipeline) already has the interface for vector-based precedent retrieval: in the POC, the retrieval is simulated by the LLM. Switching to real vector retrieval is a single-node implementation change that requires no modifications to the orchestrator, classifier, or any other pipeline component. The quality of retrieval improves continuously as the index grows: early in deployment, with only a few hundred precedents, retrieval quality is limited; after three survey cycles, with tens of thousands of validated examples, the retrieved precedents are genuinely informative few-shot context for the LLM.

**Layer C: Fine-tuned model (Year 2+, after 10,000+ validated examples).** After sufficient labeled data has accumulated, a fine-tuned variant of a smaller base model can be trained specifically on EAC classification inputs and outputs. This model would replace the Tier 1 `gpt-5.5` call for routine records, reducing per-call cost by approximately eighty percent and improving consistency on organization-specific activity vocabulary and accounting interpretation patterns. The fine-tuned model is versioned alongside the rule set in the audit trail: model version and rule version are recorded together in every audit event produced by the fine-tuned model.

### 14.3 Why Not Replace Rules with Pure LLM Learning

This question arises naturally in any discussion of machine learning for classification: if you have enough labeled data, why not train a model that directly maps inputs to outputs and dispense with the hand-crafted rules? For financial reporting classification, three reasons make this architecturally untenable.

First, audit defensibility. A classification that says "the neural network determined this was CapEx" is not an auditable explanation. An auditor asking "why was this labor capitalized?" needs a specific, verifiable answer that cites facts about the record and the rules applied to it. The signal ledger provides this. A trained classifier produces a score. The interpretability gap between "signal_capex_activity_type fired at weight 2.0" and "the model output was 0.83" is not a matter of sophistication, it is a compliance requirement.

Second, model version risk. Azure OpenAI deploys updates that change model behavior without any change to the source data. If the model owns the final classification verdict, a routine update can retroactively change the classification of records that were already submitted to the accounting system. The deterministic rules engine eliminates this class of risk entirely: the rule version is pinned, historical classifications are immutable, and a rule change goes through an approval workflow rather than a deployment pipeline.

Third, conflict rate and human accountability. The system is designed to route genuinely ambiguous records to human review. A trained classifier, especially a well-calibrated one, tends to produce confident outputs even for records where the correct accounting treatment is genuinely uncertain. The deterministic confidence scoring routes these records to the Domain Lead escalation queue. Replacing the confidence scoring with a neural model's output probability would require recalibrating the routing threshold from scratch, and the resulting behavior is harder to explain to Finance reviewers who need to understand why records are being sent to them for review rather than directly to employees.

```
Override event → Cosmos DB change feed → Labeled Training Store (PostgreSQL)
     |
     +—> [immediate]   embed + add to Azure AI Search (improves RAG next batch)
     |
     +—> [N ≥ 500]     signal weight recalibration job → Finance SME approval → new rule_version
     |
     +—> [N ≥ 10,000]  fine-tuning job (Azure ML) → new model deployment → registered Tier 1 replacement
```

Every stage of the learning loop is human-gated before promotion. The learning is automated; the promotion requires a named Finance SME approver. This preserves the accountability principle: no classification engine change takes effect without a named human who reviewed and approved it.

---

## 15. Summary

The Employee Activity Classification System is designed around a single thesis: the capitalizable labor problem is tractable because observable digital workplace signals provide a reliable proxy for employee activity, and the correct architectural response to this tractability is a system that replaces annual recall with continuous observation, shifting the employee's role from constructing a survey response from memory to confirming a pre-populated estimate derived from their actual recorded activity.

Every significant architectural decision described in this document, deterministic rules as the classification authority, a formal connector contract as the extensibility mechanism, the pre-fetch async pipeline, KEDA scale-to-zero on Azure Container Apps, append-only immutable audit events in Cosmos DB, and the three-layer continual learning roadmap, was made to satisfy a single overriding requirement: every classification must be reproducible, traceable to specific observable signals, and defensible to an auditor without relying on any employee's memory or any language model's opacity.

The POC delivers the full end-to-end workflow for the Network Annual Capital Labor Survey on Azure infrastructure. Every stub has a named Azure production replacement with a documented integration path. Every scaling assumption has been validated against batch throughput numbers. Every design decision has a stated rationale and an acknowledged trade-off. The continual learning roadmap shows a clear progression from hand-crafted signal weights to empirically calibrated rules, RAG-based precedent retrieval, and eventually a fine-tuned classification model, at every stage, in a form that preserves the audit trail's defensibility.
