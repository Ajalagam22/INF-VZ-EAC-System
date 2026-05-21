# API Documentation

The submitted POC is intentionally client-side so it can be reviewed from a public Vercel URL without credentials or backend provisioning. The production API contract below describes how the browser POC maps to deployable services.

## `POST /api/ingest/excel`

Accepts an Excel workbook and emits normalized activity records.

Response shape:

```json
{
  "source_type": "excel",
  "records_processed": 149,
  "records_accepted": 149,
  "records_rejected": 0,
  "run_id": "run_2026_05_20_001"
}
```

## `POST /api/ingest/forms`

Accepts a ZIP of DOCX survey forms, extracts 39 mapped fields per form, and validates records against Excel keys when a reference dataset is available.

Response shape:

```json
{
  "source_type": "docx_forms",
  "forms_processed": 10,
  "field_count": 39,
  "matched_reference_rows": 10,
  "run_id": "run_2026_05_20_001"
}
```

## `POST /api/classify`

Accepts normalized records and returns CapEx / OpEx / Review outputs.

Response shape:

```json
{
  "records": [
    {
      "record_key": "6770487-2022-1",
      "classification": "CapEx",
      "confidence": 91,
      "evidence": "96% capital-eligible labor signal; capital build context; milestone evidence supports traceability",
      "rule_version": "capital-policy-v1.0"
    }
  ]
}
```

## `POST /api/overrides`

Captures a human override and writes an immutable audit event.

Response shape:

```json
{
  "record_key": "6770487-2022-1",
  "previous_classification": "CapEx",
  "new_classification": "Review",
  "audit_event_id": "audit_001"
}
```

## `GET /api/audit/{record_key}`

Returns the decision trail for a classified record, including input signals, rule version, confidence, output, and override history.
