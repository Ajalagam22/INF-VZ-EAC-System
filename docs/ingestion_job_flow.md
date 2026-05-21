# Ingestion Job Flow

This document describes the job-based ingestion path for the Employee Activity Classification POC.

## Why this exists

The upload path now uses a persisted job queue so the API does not need to hold the full classification run open. That gives the POC a production-shaped boundary for:

- large Excel uploads
- multi-file DOCX form sets
- retryable background processing
- status polling from the frontend
- job persistence across a browser refresh

## Runtime flow

1. The browser uploads an Excel workbook or DOCX form archive.
2. The API stores the raw payload on disk under the configured staging directory.
3. The API inserts an `ingestion_jobs` row with `queued` status.
4. The browser receives a `job_id` and polls `/api/upload/jobs/{job_id}`.
5. A background worker loop claims the next queued job.
6. The worker reads the staged payload, runs the same canonical normalization and classification pipeline, and persists the resulting records and batch manifest.
7. The worker updates the job row to `completed` or `failed`.
8. Once complete, the status endpoint returns both the job metadata and the finished classification payload.

## Job lifecycle

- `queued`: accepted by the API and waiting for a worker
- `processing`: claimed by the worker and actively being handled
- `completed`: persisted run and manifest are available
- `failed`: the worker failed and the error message is stored on the job

## What is persisted

- job metadata
- source file name
- staged payload path
- per-job progress counters
- run id for the finished classification batch
- manifest summary
- final records in the existing activity tables

## What remains lightweight in the POC

- a single local worker process instead of a distributed queue cluster
- disk-based staging instead of object storage
- SQLite-compatible persistence for local development

## Worker command

Run this in a second terminal while the API is running:

```bash
cd backend
python3 -m app.workers.ingestion_worker
```

The worker polls the job table, claims queued jobs, and processes them sequentially.

## Why this is the right POC shape

The POC now mirrors the production contract without needing a heavy queue stack. The browser is no longer coupled to the full ingest run, but the architecture still leaves clear replacement points for Celery, SQS, object storage, and horizontally scaled workers later.
