# Stub Inventory

This document lists the parts of the system that are intentionally simulated in the current build and what should replace them in production.

## Active Stubs

| Area | Current Implementation | Production Replacement |
| --- | --- | --- |
| HR persona data | Persona inferred from `Team`, with a configured fallback persona | HRIS / Workday connector with job family, role, org, and persona configuration |
| LLM reasoning | `litellm` client falls back to a local stub when no provider is configured | Azure OpenAI or another approved model endpoint with governed prompts and JSON validation |
| Semantic retrieval | `semanticStoreLabel` is surfaced in UI and docs, but no vector store is connected | Vector database or search service with indexed precedents and policy snippets |
| Audit persistence | SQLite-backed backend tables for records, runs, and events | Immutable audit event store with retention, hashes, and access control |
| Worker topology | Single local worker loop over a persisted job table | Distributed queue workers with autoscaling and object storage staging |
| Historical labels | Derived from uploaded records and current dataset | Curated historical survey warehouse and labeled calibration store |
| Investment context | Derived from workbook and form fields | ERP / finance planning source of truth |
| Accounting policy source | Versioned rule logic in code | Managed policy/rules service with approval workflow |
| Authentication and RBAC | Public no-login deployment | Role-based access control with employee, lead, finance, admin, and platform roles |
| Future connectors | Shown as Coming Soon in the UI | Real connector implementations with the shared connector contract |

## Not Stubbed

These pieces are implemented as real runtime behavior in the current build:

- Excel workbook ingestion
- DOCX form parsing, including ZIP handling and single-file support
- Canonical record normalization
- Deterministic CapEx / OpEx classification
- Confidence scoring
- Manual override capture
- Run manifest generation
- Queue-backed ingestion job tracking
- Audit event capture
- Frontend dashboard, review queue, data sources, pipeline, analytics, and architecture views

## Notes

- Stubs are acceptable for the assessment where the requirements explicitly allow simulated data.
- None of the stubs should be treated as final production design without replacement planning, access controls, and formal data contracts.
