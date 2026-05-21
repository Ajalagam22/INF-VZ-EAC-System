from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.audit.audit_service import AuditService
from app.database.session import session_scope
from app.models.activity_record import ActivityRecord, AuditEvent, BatchRun
from app.orchestrator.flow_orchestrator import FlowOrchestrator
from app.schemas.activity_schema import IngestionResponse, OverrideRequest, RunManifest


class ClassificationService:
    def __init__(self) -> None:
        self.orchestrator = FlowOrchestrator()
        self.audit = AuditService()

    def ingest_excel_file(self, upload: UploadFile) -> IngestionResponse:
        return self._ingest(upload, source_type="Excel")

    def ingest_docx_zip(self, upload: UploadFile) -> IngestionResponse:
        return self._ingest(upload, source_type="DOCX form")

    def ingest_excel_bytes(
        self,
        payload: bytes,
        source_file_name: str,
        progress_callback: Any | None = None,
    ) -> IngestionResponse:
        return self._ingest_bytes(
            payload,
            source_type="Excel",
            source_file_name=source_file_name,
            progress_callback=progress_callback,
        )

    def ingest_docx_bytes(
        self,
        payload: bytes,
        source_file_name: str,
        progress_callback: Any | None = None,
    ) -> IngestionResponse:
        return self._ingest_bytes(
            payload,
            source_type="DOCX form",
            source_file_name=source_file_name,
            progress_callback=progress_callback,
        )

    def _ingest(self, upload: UploadFile, source_type: str) -> IngestionResponse:
        payload = upload.file.read()
        default_name = "EAC_Dataset.xlsx" if source_type == "Excel" else "sample_forms.zip"
        source_file_name = upload.filename or default_name
        return self._ingest_bytes(payload, source_type=source_type, source_file_name=source_file_name)

    def _ingest_bytes(
        self,
        payload: bytes,
        source_type: str,
        source_file_name: str,
        progress_callback: Any | None = None,
    ) -> IngestionResponse:
        with session_scope() as db:
            result = (
                self.orchestrator.run_excel(
                    db,
                    payload,
                    source_file_name,
                    progress_callback=progress_callback,
                )
                if source_type == "Excel"
                else self.orchestrator.run_docx_zip(
                    db,
                    payload,
                    source_file_name,
                    progress_callback=progress_callback,
                )
            )
            manifest = result.manifest or RunManifest(
                run_id=result.run_id,
                source_type=result.source_type,
                source_file_name=result.source_file_name
            )
            return IngestionResponse(
                run_id=result.run_id,
                source_type=result.source_type,
                source_file_name=result.source_file_name,
                processed=manifest.records_processed,
                classified=manifest.records_classified,
                quarantined=manifest.records_quarantined,
                escalated=manifest.records_escalated,
                failed=manifest.records_failed,
                matched_excel=manifest.matched_excel,
                elapsed_seconds=manifest.elapsed_seconds,
                records=result.records,
                manifest=manifest,
                agent_trace=[result.trace] if result.trace else []
            )

    def run_result(self, db: Session, run_id: str) -> Optional[IngestionResponse]:
        row = db.query(BatchRun).filter(BatchRun.run_id == run_id).first()
        if not row:
            return None
        records = [
            self._serialize_record(record)
            for record in db.query(ActivityRecord)
            .filter(ActivityRecord.run_id == run_id)
            .order_by(ActivityRecord.created_at.asc())
            .all()
        ]
        manifest_data = dict(row.manifest_json or {})
        if manifest_data:
            manifest = RunManifest.model_validate(manifest_data)
        else:
            manifest = RunManifest(
                run_id=row.run_id,
                source_type=row.source_type,
                source_file_name=row.source_file_name,
                records_processed=row.records_processed,
                records_classified=row.records_classified,
                records_quarantined=getattr(row, "records_quarantined", 0) or 0,
                records_escalated=row.records_escalated,
                records_failed=row.records_failed,
                matched_excel=row.matched_excel,
                elapsed_seconds=row.elapsed_seconds,
                agent_timings={},
                errors=[]
            )
        return IngestionResponse(
            run_id=row.run_id,
            source_type=row.source_type,
            source_file_name=row.source_file_name,
            processed=row.records_processed,
            classified=row.records_classified,
            quarantined=getattr(row, "records_quarantined", 0) or 0,
            escalated=row.records_escalated,
            failed=row.records_failed,
            matched_excel=row.matched_excel,
            elapsed_seconds=row.elapsed_seconds,
            records=records,
            manifest=manifest,
            agent_trace=[records[0].get("_agentTrace")] if records and records[0].get("_agentTrace") else [],
        )

    def list_records(self, db: Session, limit: int = 500) -> List[Dict[str, Any]]:
        # Return records from the most recent batch run per source type
        # so repeated uploads don't accumulate duplicates in the UI
        latest_runs: Dict[str, str] = {}
        for batch in (
            db.query(BatchRun)
            .order_by(BatchRun.created_at.desc())
            .all()
        ):
            if batch.source_type not in latest_runs:
                latest_runs[batch.source_type] = batch.run_id

        if latest_runs:
            rows = (
                db.query(ActivityRecord)
                .filter(ActivityRecord.run_id.in_(latest_runs.values()))
                .order_by(ActivityRecord.created_at.desc())
                .limit(limit)
                .all()
            )
        else:
            rows = (
                db.query(ActivityRecord)
                .order_by(ActivityRecord.created_at.desc())
                .limit(limit)
                .all()
            )
        return [self._serialize_record(row) for row in rows]

    def latest_run(self, db: Session) -> Optional[Dict[str, Any]]:
        row = db.query(BatchRun).order_by(BatchRun.created_at.desc()).first()
        if not row:
            return None
        result = self.run_result(db, row.run_id)
        return result.model_dump() if result else {
            "run_id": row.run_id,
            "source_type": row.source_type,
            "source_file_name": row.source_file_name,
            "records_processed": row.records_processed,
            "records_classified": row.records_classified,
            "records_escalated": row.records_escalated,
            "records_failed": row.records_failed,
            "matched_excel": row.matched_excel,
            "elapsed_seconds": row.elapsed_seconds,
            "manifest": row.manifest_json
        }

    def override_record(self, db: Session, record_uid: str, request: OverrideRequest) -> Dict[str, Any]:
        row = db.query(ActivityRecord).filter(ActivityRecord.record_uid == record_uid).first()
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        if request.classification is None:
            row.override = None
            row.override_note = None
        else:
            row.override = request.classification
            row.override_note = request.note
        db.add(row)
        self.audit.record_event(
            db,
            run_id=row.run_id,
            record_uid=row.record_uid,
            event_type="override",
            payload={"classification": row.override, "note": row.override_note}
        )
        db.commit()
        db.refresh(row)
        return self._serialize_record(row)

    def audit_timeline(self, db: Session, record_uid: str) -> List[Dict[str, Any]]:
        return self.audit.timeline(db, record_uid)

    def summary(self, db: Session) -> Dict[str, Any]:
        records = db.query(ActivityRecord).all()
        total = len(records)
        capex = sum(1 for row in records if (row.override or row.classification) == "CapEx")
        opex = sum(1 for row in records if (row.override or row.classification) == "OpEx")
        review = sum(1 for row in records if (row.override or row.classification) == "Review")
        overrides = sum(1 for row in records if row.override)
        return {
            "total": total,
            "capex": capex,
            "opex": opex,
            "review": review,
            "overrides": overrides
        }

    def _serialize_record(self, row: ActivityRecord) -> Dict[str, Any]:
        payload = dict(row.payload_json or {})
        payload.update(
            {
                "_id": row.record_uid,
                "_recordUid": row.record_uid,
                "_classification": row.classification,
                "_confidence": row.confidence,
                "_evidence": row.evidence,
                "_reviewReason": row.review_reason,
                "_source": row.source_type,
                "_sourceRecordId": row.source_record_id,
                "_ruleVersion": row.rule_version,
                "_persona": row.persona,
                "_normalizedAt": row.normalized_at.isoformat() if row.normalized_at else None,
                "_override": row.override,
                "_overrideNote": row.override_note,
                "_matchedExcel": row.matched_excel,
                "_extractionConfidence": row.extraction_confidence,
                "_sourceFileName": row.source_file_name
            }
        )
        return payload
