Employee Activity Classification System

AI-Enabled CapEx / OpEx Activity Classification System

Design & Build Assessment ⚠ Candidate Brief

Submission Deadline: May 21, 2026 at 12:00 PM CST ⚠ Hard Deadline — No Extensions

Scope: End-to-end AI-enabled classification system — demonstrating AI engineering prowess, solution architecture, and ability to deliver a production-grade experience under an aggressive timeline.

Candidate Delivery Requirements

Read this section in full before anything else in this document. All items below are required deliverables unless explicitly marked as extra credit. Submissions that do not meet the delivery format will not be evaluated.

Stubbed & simulated data is encouraged throughout. Beyond the two provided data inputs, all other data contexts — HR profiles, accounting rules, investment/funding designations, historical survey data — may be simulated, hardcoded, or mocked. Candidates will not be penalised for well-designed stubs. What matters is clear documentation of what is stubbed and how it would connect to real data sources in a production deployment.

1. Live Application URL (Vercel) — Required

Deploy your application to Vercel and submit the live public URL. The URL must be publicly accessible without authentication at the time of evaluation. If the link is unavailable or requires login during testing, the submission cannot be assessed. Do not submit a localhost URL.

2. GitHub Repository Link — Required

Submit a link to your complete source code repository. The repository must be public or accessible via the submitted link. Include a README.md with setup instructions, technology choices, and any environment variable guidance needed to understand the project.

3. Architecture Document (PDF or Word) — Required

A written technical document covering: (a) system architecture — components, interfaces, and data flow; (b) pluggable connector framework design — how new data sources would be integrated; (c) data enrichment pipeline described in depth for production scale; (d) CapEx/OpEx classification rule logic with accounting rationale; (e) audit trail design for production; (f) a clear description of the form parsing pipeline — methodology, extraction logic, schema mapping approach, and how it would scale to hundreds of form documents; (g) a description of every stub or simulated component and how it would be replaced in production.

4. Architecture Diagram & Documentation Depth — Required

Evaluated as a standalone criterion. The architecture diagram must be impeccable — professionally drawn, clearly labelled, and complete enough that a senior engineer unfamiliar with the project could understand the full system from it alone. The written documentation must demonstrate genuine depth: a thorough problem statement analysis in the candidate's own words, evidence of brainstorming and considered trade-offs, explicit rationale for every significant design decision, and in-depth explanation of both the form ingestion pipeline and the data enrichment process at enterprise scale. Shallow bullet-point summaries will not score well. The evaluator is looking for intellectual rigour, clarity of thinking, and the ability to communicate complex architectural reasoning in plain language. The length and depth of this section are a direct signal of how seriously the candidate engaged with the problem.

5. Email Submission — All Deliverables in One Email

Send all deliverables (Vercel URL, GitHub link, Architecture Document) to pratyoosh.patel@infovision.com in a single email. Subject line: "EAC System Submission – [Your Full Name]". Deadline: May 21, 2026 at 12:00 PM CST. Late submissions will not be accepted.

Understanding the two data inputs — read before starting

Input 1 — sample_forms.zip | Data extraction test

Contains 10 structured survey form documents (.docx). Each form represents one engineer's capital activity record and holds 39 narrative-embedded data fields across 8 sections (identity, time period, geography, spend classification, financials, labor activity, field detail, project status). Candidates must build a form parsing and data extraction pipeline that reads each document, extracts the structured fields, and maps them to the standard data schema. These 10 extracted records correspond to 10 specific rows in the Excel dataset — use this match as a validation check for your parser accuracy. This input tests ingestion methodology and data retrieval capability.

Input 2 — EAC_Dataset.xlsx | Full classification workflow dataset

Contains the complete activity dataset — including the 10 rows that correspond to the form documents above, plus the full volume of records needed for the classification engine to demonstrate meaningful output. After validating your form parser against those 10 rows, use the complete Excel dataset to run the full classification workflow. This input eliminates the need to manually process a large volume of forms and provides sufficient data depth and variety for the CapEx/OpEx engine. Both the Excel upload and the form extraction pipeline must be functional in the submitted application.

6. Excel Dataset Upload (EAC_Dataset.xlsx) — Full Workflow Data Source — Required

The provided Excel file contains the complete activity dataset for the classification workflow. It includes all records needed for the CapEx/OpEx engine to produce meaningful output at scale, including the 10 rows that correspond directly to the form documents in sample_forms.zip. The Excel upload must be functional in the application as the primary data connector. After demonstrating form extraction on the 10 forms, use the complete Excel dataset to run the full classification pipeline. The Excel connector tests your ability to ingest and process structured tabular data at volume.

7. Form Documents (sample_forms.zip) — Data Extraction Test — Required

The ZIP file contains 10 structured survey form documents (.docx format), each representing one engineer's capital activity record across 39 questions and 8 sections. Candidates must build a form parsing pipeline that reads each document, extracts all structured data fields from the narrative-embedded responses, and maps them to the standard input schema. The 10 extracted records correspond to 10 specific rows in the Excel dataset — your parser output must match those rows, and this match should be demonstrated or documented. This component specifically tests data retrieval methodology, document ingestion capability, and schema normalisation — it is not about building the classification engine. The form parser and the Excel connector are two separate connectors within the same pluggable connector framework; both must be functional in the submitted application.

8. "Coming Soon" Connector Panel — UI Requirement

The UI must include a visual panel showing additional data source types as icons labelled "Coming Soon" — for example: Google Drive, BigQuery, Google Sheets, SharePoint, Jira, Confluence, Slack, or similar. This panel demonstrates architectural awareness of the source-agnostic, pluggable connector design. Only the Excel and form document connectors need to be functional.

9. Data Enrichment Pipeline Visualization — UI Requirement

The UI must include a visual pipeline or stepped diagram showing the stages data passes through before classification — for example: schema validation → field normalization → activity signal weighting → rules context injection → classification ready. This pipeline applies to both the Excel and form inputs. A clear static visual is sufficient. The Architecture Document must describe the enrichment process at enterprise scale.

10. CapEx/OpEx Classification Engine — Functional Requirement

A working classification engine must ingest the uploaded Excel data and produce per-record output with: (a) CapEx or OpEx designation; (b) a confidence score (0–100); (c) a plain-language evidence note explaining the classification. The engine may be rule-based, prompt-based, or a hybrid. Candidates must be prepared to explain and defend the logic.

11. Classification Output Dashboard — UI Requirement

The application must display a summary dashboard showing: total CapEx %, total OpEx %, a per-record classification table with evidence notes, and a mechanism to manually override a classification. The correction does not need to persist across sessions for the POC.

12. Audit Trail Stub — UI Requirement

The UI must include an audit trail panel or view demonstrating how classifications would be traced in production — showing input signals, rule version, confidence score, classification output, and any overrides. A navigable stub is explicitly expected and sufficient. Document in the Architecture Document how this stub would become a production audit system.

13. AI Tools — Expected, Not Optional

Use of AI tools, coding assistants, code-generation platforms, and LLMs is actively expected. The evaluation focuses on architecture quality, solution design thinking, and delivered experience. Both the Excel dataset and the form documents are non-proprietary mocked data and may be shared freely with any AI tool or LLM. There is no scoring penalty for AI-assisted development.

14. Extra Credit — UX and Dashboard Design Creativity

Extra credit is awarded for creativity, visual polish, and UX thoughtfulness. Candidates who deliver a compelling, well-organised, and aesthetically strong user experience will be recognised. Criteria: data visualisation quality, layout and information hierarchy, interactive elements, and overall aesthetic quality. This is an opportunity to show how you think about UX — take it.

1. Executive Summary

This document defines the complete business and technical requirements for an AI-enabled Employee Activity Classification System. The system automatically classifies employee work activities as Capital Expenditure (CapEx) or Operating Expense (OpEx) by ingesting observable digital workplace signals, applying fixed asset accounting rules, and producing per-employee classifications that are auditable, defensible, and actionable.

The financial opportunity this system addresses is measured in hundreds of millions of dollars annually. A significant portion of the workforce — estimated at over 21,000 employees — currently books 100% of their time to operating expense, including activities that qualify for capital treatment. The system is designed to identify, classify, and surface that capitalizable labor without requiring employees to manually reconstruct or categorize their activities.

The system is architected around three principles confirmed by the sponsoring organisation: (1) engine-first and source-agnostic — the classification engine is the primary deliverable; data connectors are pluggable inputs; (2) overnight batch processing — signals are collected during the day and classified in a nightly run; and (3) 80% one-size-fits-all coverage — the engine handles the dominant employee persona patterns generically.

For the purposes of this assessment, two data inputs are provided. The first is a set of 10 structured survey form documents (sample_forms.zip) that candidates must parse and extract into structured records — testing ingestion capability. The second is a complete Excel dataset that candidates use to run the full classification workflow at scale. Both connectors must be functional in the submitted application.

2. Business Context and Problem Statement

2.1 The Core Business Problem

Large enterprises with significant technology and engineering workforces are required to classify employee labor activities as either capital expenditure or operating expense. Correct classification directly affects financial reporting, tax treatment, balance sheet strength, and regulatory compliance. Misclassification results in the permanent loss of capitalisation opportunity that cannot be retroactively recovered.

The classification process today relies on the following mechanism, with significant deficiencies:

Annual capital labor survey: Engineering and network operations employees complete a once-per-year survey estimating the percentage of time spent across broad capital vs. expense activity categories. Annual recall is highly unreliable. The survey window is fixed (typically May) regardless of when work occurred.

2.2 The Opportunity

Observable digital workplace data — emails, calendar events, meeting participation, project tickets, task completions, system activity logs — provides a near-complete record of what employees do each day. Combined with HR job profile data, fixed asset accounting rules, and investment context, this is sufficient to infer activity classification with high confidence for the majority of employees.

An AI-enabled classification engine can: (1) pre-populate annual labor survey responses for survey populations, substantially reducing annual recall burden; and (2) automatically classify the previously untracked employee population, recovering capitalizable labor currently booked entirely to OpEx.

2.3 Current State Inventory

| Mechanism | Employee Population | Current Pain | System Impact |
| --- | --- | --- | --- |
| Annual capital labor survey | Network and engineering populations across multiple markets | Annual recall unreliable; fixed survey window in May | Pre-populate survey from year-long activity signals; eventually automate submission |
| No classification (100% OpEx default) | 21,000+ employees booking all time to operating expense | Capitalizable labor permanently lost; growing population as builder culture expands | Automatically classify and surface capitalizable activities for this population |

3. Business Objectives

[BO-01] Classify employee work activities as CapEx or OpEx using AI inference over observable digital workplace signals, with no manual reconstruction required from employees.

[BO-02] Reduce employee cognitive burden for activity reporting to a review-and-confirm interaction rather than a recall-and-categorize task.

[BO-03] Pre-populate annual capital labor survey responses for network and engineering populations based on a full year of aggregated activity signals.

[BO-04] Identify and classify capitalizable activities performed by the untracked employee population (currently booking 100% OpEx) and surface these for recognition.

[BO-05] Produce a measurable and trackable capitalisation shift metric — quantifying the movement of labor from OpEx to CapEx classification over time.

[BO-06] Build a classification engine that is source-agnostic and extensible — capable of serving additional employee populations, job families, and reporting cadences without architectural rebuilds.

[BO-07] Ensure all classifications are auditable, traceable to specific observable signals, and defensible against accounting and regulatory scrutiny.

4. Success Metrics

4.1 POC Success Criteria

The prototype is considered successful if it demonstrates the end-to-end classification pipeline functioning on at least one primary use case, with human-review output that a domain expert can evaluate for accuracy and defensibility. The prototype does not need to be production-complete — it must be experience-ready and architecturally sound.

| Metric | POC Target | Measurement Method |
| --- | --- | --- |
| End-to-end pipeline | Functional: ingest → classify → output | Demo on at least one use case |
| Form data extraction | 10 form records extracted and schema-mapped; match validated against Excel | Parser output vs. Excel row comparison |
| Classification accuracy | ≥ 70% agreement with domain expert review on test set | Manual review by domain expert / evaluator team |
| Confidence scoring | Every record carries a confidence score | System output inspection |
| Human review flow | Corrections captured and visible | UI walkthrough |
| Auditability | Each classification traceable to specific signals | Output report review |
| Capitalisation shift metric | Baseline vs. classified delta visible | Output dashboard or report |
| Batch run architecture | Described in document; on-demand execution acceptable for POC | Architecture document review |

5. Scope Definition — Required for POC

| Capability Area | Required |
| --- | --- |
| Classification engine | Functional engine producing CapEx/OpEx output with confidence scores and evidence notes |
| Use case coverage | At minimum: Network Capital Labor Survey use case |
| Form data extraction pipeline | 10 form documents parsed; structured records extracted and schema-mapped; validation against corresponding Excel rows demonstrated or documented |
| Excel data ingestion | Full Excel dataset ingested and processed through the classification workflow |
| Agent architecture | Orchestrator, Data Harvesting, Context Builder, Classification, Policy/Rules, Confidence/Routing — functional pipeline; agents may be stubs |
| Human review interface | Per-employee classification output with confidence indicators and evidence trail |
| Capitalisation shift metric | Baseline vs. post-classification delta surfaced in output |
| Survey pre-population | Output formatted to match annual survey categories with % splits per employee |
| Connector framework | Two functional connectors (Excel + form parser); pluggable interface documented; "Coming Soon" panel in UI |
| Persona coverage | Network engineering persona |
| Value tracking output | Per-employee and aggregate CapEx reclassification amount visible |
| Audit trail stub | Audit trail panel in UI — input signals, rule version, confidence, output, overrides |
| Architecture diagram | Impeccable, fully labelled system diagram submitted with Architecture Document |

6. Functional Requirements

FR-1: Classification Engine

The classification engine is the primary deliverable of this system. All other components exist to serve it. It must be built first and treated as source-agnostic — its inputs are structured records from the data layer, not raw connector outputs.

[REQ-01] The engine SHALL accept as input a structured per-employee activity record containing: observable signals (meeting count, ticket count, email frequency, system activity), HR context (job title, job family, organisation), investment/project context (funding category, spend designation), and a time window (day, week, or year).

[REQ-02] The engine SHALL apply fixed asset accounting rules to each activity record and classify it as: (a) clearly CapEx, (b) clearly OpEx, or (c) ambiguous/gray-area requiring human review.

[REQ-03] The engine SHALL produce a confidence score (0–100) for every classification. Low confidence SHALL trigger routing to the human review queue, not direct output to the employee.

[REQ-04] The engine SHALL produce an evidence trail for every classification — citing the specific observable signals that drove the classification decision. This trail must be human-readable and accompany every output record.

[REQ-05] The engine SHALL operate in Annual mode for this assessment — producing percentage-of-time distribution across survey categories per employee. The architecture must be designed to support additional output modes as future capabilities, and the Architecture Document must describe how a Weekly mode would be implemented without engine code changes.

[REQ-06] The engine SHALL be designed as a nightly batch process. For the POC, on-demand execution triggered by data upload is acceptable; the Architecture Document must describe how the batch model would function in production.

[REQ-07] The engine SHALL be source-agnostic. It consumes structured records from the data layer and SHALL NOT contain any connector-specific logic.

[REQ-08] The engine SHALL be configurable by persona. Persona configuration controls: output mode, aggregation window, activity-to-category mapping, confidence thresholds, and applicable accounting rule set — without modifying engine code.

FR-2: Data Ingestion and Hydration Layer

The data layer collects, normalises, and structures signals from approved sources into the unified record format consumed by the classification engine. It operates independently of the engine and is designed as a pluggable connector framework.

Two active connectors are required for this assessment: the Excel dataset connector (full workflow data) and the form document parsing connector (data extraction test). Both must be implemented and functional. They share the same connector-to-engine interface — the engine receives identically structured records regardless of whether the data originated from a spreadsheet or a parsed form document. All other data contexts (HR profiles, accounting rules, investment designations) may be stubbed.

Stubbed data: HR profiles, investment/funding designations, accounting rules, and historical survey data may be simulated or hardcoded. Document clearly what is stubbed and how each would be replaced by a production connector.

[REQ-09] The data layer SHALL implement an Excel file upload connector as the primary full-dataset input. The connector must parse the provided EAC_Dataset.xlsx, validate records against the schema, and stage clean records for the classification engine. The connector interface must be formally defined as the extensibility contract for all future connectors.

[REQ-10] The data layer SHALL implement a form document parsing connector capable of extracting structured data fields from the provided survey form documents (.docx format). Each form contains 39 narrative-embedded data fields across 8 sections. The parser must identify and extract each field from natural-language responses, map extracted values to the standard schema, and produce validated records in the same format as the Excel connector output. The 10 extracted records must be validated against the corresponding rows in the Excel dataset.

[REQ-11] The data layer SHALL support historical activity/survey data as labeled reference input for model calibration. For the POC, this data may be simulated or derived from the provided dataset.

[REQ-12] The data layer SHALL support HR job profile data (job title, job family, job description, org unit). For the POC, this data may be simulated or mocked.

[REQ-13] The data layer SHALL ingest fixed asset accounting rules as a static context document. These rules SHALL be versioned and replaceable without engine changes.

[REQ-14] The data layer SHALL support investment and funding case context: funding categories and CapEx/OpEx designation per investment. For the POC, this data may be simulated.

[REQ-15] Each connector SHALL produce output in a standardised, schema-validated record format. The connector-to-engine interface SHALL be formally defined and documented as the extensibility contract for all future connectors.

[REQ-16] The data layer SHALL support a hydration frequency of at least daily — refreshing data stores at least once per 24-hour period in advance of the nightly batch run.

FR-3: Agent Architecture

The system is implemented as an orchestrated multi-agent pipeline. Each agent has a defined responsibility, a defined interface with the orchestrator, and behavioral parameters configurable by persona. The agent taxonomy is shared across all use cases.

[REQ-17] The system SHALL implement a Flow Orchestrator that coordinates the nightly batch pipeline, manages agent sequencing, handles failures with retry logic, and produces a run manifest (inputs processed, outputs produced, errors encountered).

[REQ-18] The system SHALL implement a Data Harvesting Agent responsible for triggering connector refresh across both active connectors (Excel and form parser), validating ingested records against schema, and staging clean records for downstream agents.

[REQ-19] The system SHALL implement a Context Building Agent that constructs a per-employee context record for a given time window — a frequency distribution of activity categories across the full year for Annual mode.

[REQ-20] The system SHALL implement a Classification Agent — the core engine — that applies accounting rules and persona configuration to each context record and produces a classified output with confidence score and evidence trail.

[REQ-21] The system SHALL implement a Policy and Rules Agent that overlays fixed asset accounting rules, investment case constraints, and persona-specific classification rules on top of the base classification. This agent is the authoritative enforcer of accounting policy within the pipeline.

[REQ-22] The system SHALL implement a Confidence and Routing Agent that evaluates each classified record against configured confidence thresholds and routes: (a) high-confidence records to the output queue for user review; (b) low-confidence records to the human escalation queue — routed to domain team leads, NOT directly to individual employees.

FR-4: Output and Reporting

System outputs must be actionable, explainable, and tailored to the receiving employee population. All outputs are per-employee. Aggregate reporting is available for domain team leads and finance reviewers.

[REQ-23] The system SHALL produce a per-employee annual survey output: percentage of time distributed across applicable survey categories, each tagged as capital or expense, with aggregate evidence summary.

[REQ-24] The system SHALL produce a capitalisation shift output: for each employee and in aggregate, the system SHALL show baseline (pre-classification, assumed 100% OpEx) vs. post-classification CapEx percentage.

[REQ-25] Every output record SHALL include an evidence trail citing the specific signals that drove the classification. The evidence trail must be human-readable without technical expertise.

[REQ-26] Low-confidence records SHALL appear in a separate escalation report delivered to domain team leads, not to individual employees. The escalation report SHALL include the record, confidence score, and the signals that prevented high-confidence classification.

FR-5: User Interface and Experience

The user interface is a review-and-confirm surface, not a data entry surface. The system does the classification work; the employee reviews, confirms, or corrects.

[REQ-27] The UI SHALL present per-employee classification output in a clear, non-technical layout showing: (a) classified activities, (b) CapEx/OpEx designation, (c) confidence level, and (d) plain-language evidence.

[REQ-28] The UI SHALL provide a correction mechanism: employees can override any classification, reassign an activity to a different category, and submit the correction. Every correction is captured and logged.

[REQ-29] The UI SHALL support flexible cadence: employees can review at any point. The system retains classified records until the employee acts on them. No fixed submission schedule is enforced.

[REQ-30] The UI SHALL NOT surface low-confidence records to individual employees. Low-confidence records are handled through the escalation queue to domain leads only.

[REQ-31] The UI SHALL display aggregate capitalisation metrics: total hours classified as CapEx, total classified as OpEx, and overall capitalisation percentage for the current period.

[REQ-32] Domain team lead escalation view: team leads SHALL have a separate view showing all low-confidence records for their team, with the ability to clarify, reclassify, and return resolved records to the output queue.

7. Use Case Specifications

UC-1: Network Annual Capital Labor Survey [REQUIRED — Primary POC Target]

Description

Engineering and network operations employees complete an annual survey declaring what percentage of their time was spent across approximately 15–25 capital vs. expense activity categories. This population does not submit weekly timesheets. The survey is administered annually, typically in May, across multiple markets.

Why This Is the POC Priority

Labeled training data exists: historical survey responses provide ground truth for model validation.

Data access is available: both the Excel dataset and the 10 sample form documents are provided.

Immediate business deadline: the annual survey window is active at the time of the POC.

Existing precedent: an existing tool has demonstrated this classification is feasible — the prototype replaces and improves on it.

User Journey

Current state: Employee receives annual survey in May and must recall a full year of activity from memory to estimate percentage splits across 15–25 categories. Accuracy is poor. Effort is high.

Target state for POC: Employee receives their pre-populated survey with percentage splits already filled in, derived from a full year of observed system activity. Employee reviews, adjusts if needed, and confirms. Effort is minutes rather than hours.

Future state: Survey is submitted automatically. Employee is notified only if a classification requires their input due to ambiguity.

Data Inputs — UC-1

REQUIRED

EAC_Dataset.xlsx: complete activity dataset used for the full classification workflow.

sample_forms.zip: 10 survey form documents (.docx) — parsed and extracted to validate the form ingestion pipeline; the extracted records correspond to 10 rows in the Excel dataset.

HR job profile data: job title, job family, organisation unit (simulated for POC).

Fixed asset accounting rules applicable to network and engineering functions.

Stubbed data: All data contexts beyond the two provided files may be stubbed. Clearly document what is simulated and how each stub would connect to production data sources.

Output Format — UC-1

Per-employee: annual percentage distribution across survey categories, each tagged capital or expense.

Per-employee: evidence summary citing the signal types and counts that drove each allocation.

Per-employee: confidence score per category allocation.

Aggregate: team-level and organisation-level capitalisation shift (baseline vs. classified).

Escalation report: employees with low-confidence classifications requiring team lead review.

Engine Behavior — UC-1

Context window: full calendar year (or available data range).

Aggregation mode: frequency distribution — how many times each activity type occurred, weighted by duration where available.

Output mode: annual percentage split across survey categories.

Training baseline: historical survey responses used to calibrate category mappings.

8. Data Requirements

8.1 Data Architecture Principles

All data ingested by the system flows into a shared data store before it is consumed by the classification engine. The engine NEVER calls source connectors directly during a classification run. This design enables: (1) cost-effective overnight batch processing, (2) historical replay, (3) connector-engine independence, and (4) unified schema enforcement. Both active connectors — Excel upload and form document parser — deposit records into the same shared data store in the same schema, so the engine cannot and does not distinguish their origin.

8.2 Data Source Registry

For the POC, two data sources are active (Excel + form documents). All others may be stubbed. The registry below represents the full production target architecture.

| Source | Signal Type | Format / Access | POC Status | Classification Relevance |
| --- | --- | --- | --- | --- |
| EAC_Dataset.xlsx | Full employee activity dataset — all fields per the standard schema | Excel (.xlsx) — provided with test materials | REQUIRED — Active | Primary full-volume data source for classification workflow |
| sample_forms.zip (10 forms) | 39-field narrative survey forms — initiative identity, time, geography, spend, financials, labor, field activity, status | .docx documents — provided with test materials | REQUIRED — Active | Data extraction test; 10 extracted records validate against Excel rows |
| Historical activity / survey data | Labeled classification reference: employee-declared annual % splits by category | Provided as simulated dataset within test materials | REQUIRED — Simulated | Ground truth for model calibration and validation |
| HR job profile data | Job title, job family, job description, org unit | Simulated / mocked data acceptable for POC | REQUIRED — Simulated | Critical context for persona-based classification weighting |
| Fixed asset accounting rules | Policy document: which activity types qualify as capital vs. expense | Static document — one-time injection, versioned | REQUIRED | Authoritative rules for classification decisions |
| Investment / funding case data | Funding categories and CapEx/OpEx designation per investment | Simulated / mocked data acceptable for POC | REQUIRED — Simulated | Maps employee activity to specific capital investments |

8.3 Data Quality Requirements

[REQ-33] All ingested records — whether sourced from the Excel connector or the form parsing connector — SHALL be validated against the same connector schema before being staged for the classification engine. Invalid records are rejected, logged, and reported in the nightly run manifest.

[REQ-34] The form document parsing connector SHALL extract all 39 data fields from each survey form and map them to the standard schema. Fields that cannot be confidently extracted SHALL be flagged with a null value and a parsing confidence note rather than silently dropped.

[REQ-35] The system SHALL handle missing signals gracefully: if a data field is unavailable for a given employee record, the engine classifies using available signals with a proportionally reduced confidence score.

[REQ-36] HR job profile data SHALL be refreshed at least weekly to reflect role changes, transfers, and promotions.

[REQ-37] Fixed asset accounting rules SHALL be versioned. Any rule change produces a new version; historical classifications retain the rule version active at the time of classification.

9. Architecture Principles

These principles are confirmed design constraints — not preferences. The prototype architecture must conform to all of them. Future iterations must extend, not contradict, these principles.

AP-01: Engine-First, Source-Agnostic

The classification engine is the primary deliverable. Its inputs are structured records from the data layer. It contains no connector-specific logic. Whether a record originated from a spreadsheet or a parsed form document, the engine receives and processes it identically. Connectors are pluggable inputs that can be added, swapped, or upgraded independently.

AP-02: Overnight Batch as the Primary Processing Model

Signals are collected throughout the day into the shared data store. The classification engine runs as a nightly batch process. Results are available by the following morning. This model is cost-effective, avoids live API rate limits, and supports historical replay. Real-time processing is a Future State capability.

AP-03: 80% One-Size-Fits-All Coverage

The engine handles the dominant employee persona patterns with a generic, configurable model. The target is ≥ 80% of the employee population classified without custom persona-specific logic. The remaining ≤ 20% is addressed in subsequent iterations.

AP-04: Parameterizable Persona Configuration

All persona-specific behavior is expressed as configuration, not code. Adding a new persona requires a new config file, not a code change.

AP-05: Modular, Versioned Connector Framework

Every data source is a versioned, independently deployable connector. The connector-to-data-layer interface is the system's primary extensibility contract. The Excel connector and the form document parsing connector are the two reference implementations — new connectors are onboarded by conforming to this same interface.

AP-06: Human Accountability is Structurally Enforced

Low-confidence classifications never reach employees directly. They are routed to domain team leads through a structured escalation queue. This is a compliance requirement, not a UX preference.

AP-07: Defensibility by Design

Every classification carries a traceable evidence trail. The system can explain, at any time, why a specific record was classified as it was — citing specific signals, their values, and the rules applied. This trail is immutable and retained for audit purposes.

AP-08: Designed for Scale — Architecture Vision

The architecture is built to serve an arbitrary number of stakeholder groups, each with different reporting cadences, job taxonomies, data sources, and accounting rule sets. The POC delivers for one use case. The architecture must demonstrate in the Architecture Document how the system would scale to serve dozens of stakeholder groups without a structural rebuild. This is an architecture vision requirement — it must be evident in the diagram and documentation, not necessarily in the running prototype.

10. Non-Functional Requirements

NFR-1: Performance

[REQ-38] The nightly batch run SHALL complete within a 12-hour window for the POC employee population size.

[REQ-39] The UI SHALL load the per-employee classification view in under a minute for a single employee record.

NFR-2: Accuracy and Confidence

[REQ-40] The classification engine SHALL produce a confidence score for 100% of processed records. No record is output without a score.

[REQ-41] POC target: ≥ 70% of classifications confirmed correct by domain expert review on a representative test set.

[REQ-42] The form parsing connector SHALL achieve ≥ 90% field extraction accuracy across the 10 provided forms, measured against the corresponding Excel rows.

NFR-3: Auditability and Traceability

Full production audit infrastructure is not required for the POC. The audit trail must be architecturally designed and represented in the UI as a navigable stub.

[REQ-43] Every classification SHALL have an immutable audit record: input signals, rule version, confidence score, output, and any human overrides.

[REQ-44] The system SHALL log every data access event: which employee record was accessed, by which component, at what time. A stub implementation is acceptable for the POC.

NFR-4: Security and Access Control

[REQ-45] All data access operates under a scoped read-only permission model. No connector has write access to source systems.

[REQ-46] Employee classification data is accessible only to: (a) the employee themselves, (b) their authorised domain team lead, (c) authorised finance reviewers, and (d) admins and platform developers.

[REQ-47] All data in transit is encrypted. All data at rest in the shared data store is encrypted. (Exclude this rule for staged data outside of the production ecosystem.)

NFR-5: Extensibility

[REQ-48] Adding a new data source connector SHALL require no changes to the classification engine, orchestrator, or agent logic.

[REQ-49] Adding a new employee persona SHALL require only a new persona configuration file — no code changes.

[REQ-50] The fixed asset accounting rule set SHALL be updatable without a system deployment.

NFR-6: Observability

[REQ-51] Every nightly batch run produces a run manifest: records processed (by source connector), classified, escalated, failed, and elapsed time per agent.

[REQ-52] The conflict rate (corrections as % of classifications) is tracked per run and surfaced in the system dashboard.

11. Constraints and Assumptions

11.1 Confirmed Constraints

First iteration covers full-time employees only. Vendors and contractors are explicitly out of scope.

The system must not contact individual employees directly for clarification. All employee-facing interaction is through the approved UI or mediated through domain team leads.

All data access requires explicit approval through the organisational data governance process.

Fixed asset accounting rules are externally defined and must be treated as immutable inputs to the system — the system applies them, it does not define them.

11.2 Assumptions

Two data inputs are provided for the POC: EAC_Dataset.xlsx (full workflow dataset) and sample_forms.zip (10 survey form documents for data extraction testing). Both must be supported as active connectors.

The 10 form documents in sample_forms.zip correspond to 10 specific rows in EAC_Dataset.xlsx. Candidates should use this correspondence to validate their form extraction parser.

Simulated or mocked HR profile data is acceptable for POC purposes. Candidates may derive persona context from the provided dataset or create reasonable simulations — document clearly what is mocked.

General GAAP/accounting capitalisation principles may be applied if specific fixed asset accounting rules are not provided. The system must be designed to accept rule documents as versioned inputs.

All non-provided data contexts (investment designations, accounting rules, historical survey data) may be stubbed for the POC. The Architecture Document must describe precisely how each stub would be replaced in production.

The POC operates in shadow/dark mode — classification outputs are for demonstration and evaluation purposes only.

12. Glossary

CapEx (Capital Expenditure)

Spending on assets that provide long-term value — in this context, labor spent on building, designing, or creating systems and capabilities. Capitalizable labor is amortised over the asset's useful life.

OpEx (Operating Expenditure)

Day-to-day operational spending — labor spent on activities that do not qualify as capital investment (administration, maintenance, support, etc.).

Capital Labor Survey

An annual survey completed by network and engineering employees estimating the percentage of their time spent across capital vs. expense activity categories.

Fixed Asset Accounting Rules

The organisational policy document that defines which activity types qualify as capital expenditure vs. operating expense. Treated as an immutable input to the classification engine.

Form Document Parsing Connector

The connector responsible for reading survey form documents (.docx), extracting narrative-embedded structured data fields, mapping them to the standard schema, and depositing validated records into the shared data store. One of the two active connectors required for this assessment.

Confidence Score

A 0–100 score produced by the classification engine for every classified record, representing the engine's certainty. Records below the configured threshold are routed to human review.

Evidence Trail

A human-readable explanation of why a record was classified as it was — citing specific observable signals (e.g., "activity type = build milestone; job family = network engineer; spend type = CAPEX") and the rules applied.

Conflict Rate

The percentage of classified records overridden by a human reviewer. The primary measure of classification quality over time.

Overnight Batch Run

The nightly execution of the full classification pipeline — data harvesting from all active connectors, context building, classification, confidence routing, and output generation.

Persona Configuration

A configuration file defining the behavioral parameters of the classification engine for a specific employee population: output mode, aggregation window, activity-category mapping, confidence thresholds, and applicable rule set.

Dark / Shadow Mode

A deployment model where the classification system runs in parallel with existing processes for expert review and validation — but not replacing the current submission workflow.

Stubbed / Simulated Data

Hardcoded, mocked, or generated data used in place of a live enterprise data source. A well-designed stub clearly documents what real data it represents and how it would be replaced by a production connector.

Labeled Training Data

Historical data where the correct output is known — used to calibrate and validate the classification model. For this assessment, existing capital labor survey responses serve as labeled reference data for initial calibration.
