from __future__ import annotations

import logging
from io import BytesIO
from typing import Any, Dict, Iterable, List

from docx import Document
import zipfile

from app.connectors.base.base_connector import BaseConnector
from app.config.settings import get_settings
from app.enrichment.pipeline import FORM_FIELD_MAP, clean_text, enrich_record, normalize_numeric_fields

try:
    import re
except ImportError:  # pragma: no cover
    re = None


logger = logging.getLogger(__name__)


class DocxConnector(BaseConnector):
    source_type = "DOCX form"

    def __init__(self) -> None:
        self.settings = get_settings()

    def _extract_text(self, payload: bytes) -> str:
        try:
            document = Document(BytesIO(payload))
        except (zipfile.BadZipFile, KeyError, Exception):
            text = payload.decode("utf-8", errors="ignore")
            if "<" in text and ">" in text:
                text = re.sub(r"<[^>]+>", " ", text) if re else text
            return " ".join(text.split())

        parts: List[str] = []
        for paragraph in document.paragraphs:
            line = paragraph.text.strip()
            if line:
                parts.append(line)
        for table in document.tables:
            for row in table.rows:
                for cell in row.cells:
                    # Replace intra-cell newlines with spaces, then store as one line
                    line = " ".join(cell.text.split())
                    if line:
                        parts.append(line)
        # Join with newline so each field stays on its own line for regex extraction
        return "\n".join(parts)

    def extract(self, payload: bytes, filename: str) -> List[Dict[str, Any]]:
        records: List[Dict[str, Any]] = []
        archive_buffer = BytesIO(payload)

        if zipfile.is_zipfile(archive_buffer):
            archive_buffer.seek(0)
            with zipfile.ZipFile(archive_buffer) as archive:
                all_names = archive.namelist()
                logger.info("ZIP members in %s: %s", filename, all_names)

                # Single DOCX uploaded to the forms endpoint
                if "word/document.xml" in all_names:
                    text = self._extract_text(payload)
                    records.append(self._parse_text(text, filename))
                    return records

                seen_names: set[str] = set()
                member_names = []
                for member in archive.infolist():
                    base_name = member.filename.split("/")[-1]
                    if member.is_dir() or not member.filename.lower().endswith(".docx"):
                        continue
                    if base_name.startswith("._") or base_name in seen_names:
                        continue
                    seen_names.add(base_name)
                    member_names.append(member)

                logger.info("DOCX members found in %s: %s", filename, [m.filename for m in member_names])

                if member_names:
                    for member in member_names:
                        try:
                            text = self._extract_text(archive.read(member))
                            records.append(self._parse_text(text, member.filename.split("/")[-1]))
                        except Exception as exc:
                            logger.warning(
                                "Skipping invalid DOCX member %s inside %s: %s",
                                member.filename,
                                filename,
                                exc,
                            )
                    return records

            # ZIP with no recognisable DOCX members — do not try to open it as a DOCX
            logger.warning("No .docx members found in ZIP %s; returning empty", filename)
            return records

        # Not a ZIP — treat the payload directly as a DOCX
        text = self._extract_text(payload)
        records.append(self._parse_text(text, filename))
        return records

    def _parse_text(self, text: str, source_record_id: str) -> Dict[str, Any]:
        record: Dict[str, Any] = {}
        extracted = 0
        for field, pattern in FORM_FIELD_MAP:
            match = re.search(pattern, text, flags=re.IGNORECASE) if re else None
            if match and match.group(1):
                extracted += 1
                record[field] = clean_text(match.group(1))
            else:
                record[field] = None
        record["_sourceRecordId"] = source_record_id
        record["_extractedFields"] = extracted
        record["_totalFields"] = len(FORM_FIELD_MAP)
        record["_extractionConfidence"] = extracted / max(1, len(FORM_FIELD_MAP))
        return record

    def normalize(self, raw_records: Iterable[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
        normalized: List[Dict[str, Any]] = []
        seen_keys: set[str] = set()
        for index, record in enumerate(raw_records):
            payload = {field: record.get(field) for field, _ in FORM_FIELD_MAP}
            payload = normalize_numeric_fields(payload)
            enriched = enrich_record(
                payload,
                source_type=self.source_type,
                source_file_name=filename,
                rule_version=self.settings.rule_version,
                persona_name=self.settings.persona_name,
                extraction_confidence=record.get("_extractionConfidence", 0.0),
                raw_fields=dict(record)
            ) | {
                "_sourceRecordId": str(record.get("_sourceRecordId") or index),
                "_formValidation": {
                    "extractedFields": int(record.get("_extractedFields", 0)),
                    "totalFields": int(record.get("_totalFields", len(FORM_FIELD_MAP)))
                }
            }
            record_key = str(enriched.get("_key") or "")
            if record_key and record_key in seen_keys:
                logger.warning("Skipping duplicate DOCX record with key %s in %s", record_key, filename)
                continue
            if record_key:
                seen_keys.add(record_key)
            normalized.append(enriched)
        return normalized

    def validate(self, normalized_records: Iterable[Dict[str, Any]]) -> List[str]:
        errors: List[str] = []
        for index, record in enumerate(normalized_records):
            if int(record.get("_formValidation", {}).get("extractedFields", 0)) < int(record.get("_formValidation", {}).get("totalFields", 0)) * 0.9:
                errors.append(f"DOCX record {index} extraction confidence below threshold")
            if not clean_text(record.get("InitiativeID")):
                errors.append(f"DOCX record {index} missing InitiativeID")
        return errors
