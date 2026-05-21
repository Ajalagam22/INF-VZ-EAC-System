from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Tuple

from app.schemas.normalized_activity import DataQuality, NormalizedActivityRecord

FORM_FIELD_MAP: Tuple[Tuple[str, Any], ...] = (
    ("InitiativeID", r"Initiative ID:\s*([^.\n]+)"),
    ("InitiativeName", r"Initiative Name:\s*([^.\n]+)"),
    ("DivisionCode", r"Division Code:\s*([^.\n]+)"),
    ("TechnologyGeneration", r"Technology Generation:\s*([^.\n]+)"),
    ("FiscalYear", r"Fiscal Year:\s*([^.\n]+)"),
    ("FiscalMonth", r"Fiscal Month:\s*([^(.\n]+)"),
    ("FiscalQuarter", r"Fiscal Quarter:\s*([^.\n]+)"),
    ("ProjectStartDate", r"Project Start Date:\s*([^.\n]+)"),
    ("ProjectEndDate", r"Project End Date:\s*([^.\n]+)"),
    ("SiteCity", r"Site City:\s*([^.\n]+)"),
    ("SiteState", r"Site State:\s*([^.\n]+)"),
    ("SiteZipCode", r"Site ZIP Code:\s*([^.\n]+)"),
    ("SiteSwitchCode", r"Site Switch Code:\s*([^.\n]+)"),
    ("RegionalSwitchCode", r"Regional Switch Code:\s*([^.\n]+)"),
    ("RegionalMarket", r"Regional Market:\s*([^.\n]+)"),
    ("RegionalState", r"Regional State:\s*([^.\n]+)"),
    ("OperationsCluster", r"Operations Cluster:\s*([^.\n]+)"),
    ("SpendType", r"Spend Type:\s*([^.\n]+)"),
    ("VZZ_CostClass", r"VZZ Cost Class:\s*([^.\n]+)"),
    ("VZZ_WorkType", r"VZZ Work Type:\s*([^.\n]+)"),
    ("LaborSurvey_Category", r"Labor Survey Category:\s*([^.\n]+)"),
    ("CapEx_Eligible_Pct", r"CapEx Eligible Percentage:\s*([-0-9,.]+%?)"),
    ("BudgetAmount_USD", r"Budget Amount:\s*(-?\$?[0-9,]+(?:\.\d+)?)"),
    ("ActualSpend_USD", r"Actual Spend:\s*(-?\$?[0-9,]+(?:\.\d+)?)"),
    ("ForecastSpend_USD", r"Forecast Spend:\s*(-?\$?[0-9,]+(?:\.\d+)?)"),
    ("CumulativeSpend_USD", r"Cumulative Spend:\s*(-?\$?[0-9,]+(?:\.\d+)?)"),
    ("PassingUnits", r"Passing Units:\s*([-0-9,.]+)"),
    ("Asset_Life_Years", r"Asset Life:\s*([-0-9,.]+)"),
    ("Depreciation_Annual_USD", r"Annual Depreciation:\s*(-?\$?[0-9,]+(?:\.\d+)?)"),
    ("Engineer_ID", r"Engineer ID:\s*([^.\n]+)"),
    ("Team", r"Team:\s*([^.\n]+)"),
    ("Hours_Logged", r"Hours Logged:\s*([-0-9,.]+)"),
    ("Activity_Type", r"Activity Type:\s*([^.\n]+)"),
    ("Source_System", r"Source System:\s*([^.\n]+)"),
    ("Miles_Driven", r"Miles Driven:\s*([-0-9,.]+)"),
    ("DriveTests_Completed", r"Drive Tests Completed:\s*([-0-9,.]+)"),
    ("Pre_Post_Flag", r"Pre/Post Flag:\s*([^.\n]+)"),
    ("Milestones_Completed", r"Milestones Completed:\s*([-0-9,.]+)"),
    ("Project_Status", r"Project Status:\s*([^.\n]+)")
)


def clean_text(value: Any) -> str:
    return str(value if value is not None else "").replace("\n", " ").replace("\r", " ").strip()


def to_number(value: Any) -> float:
    text = clean_text(value).replace("$", "").replace("%", "").replace(",", "")
    if not text:
        return 0.0
    negative = text.startswith("-")
    text = text.replace("-", "")
    digits = "".join(ch for ch in text if ch.isdigit() or ch == ".")
    if not digits:
        return 0.0
    try:
        parsed = float(digits)
        return -parsed if negative else parsed
    except ValueError:
        return 0.0


def to_int(value: Any) -> int:
    return int(round(to_number(value)))


def parse_date(value: Any) -> str | None:
    # Handle pandas Timestamp / datetime objects directly
    if hasattr(value, "date"):
        try:
            return value.date().isoformat()
        except Exception:
            pass
    text = clean_text(value)
    if not text:
        return None
    # Try ISO datetime first (e.g. "2022-01-10 00:00:00" from pandas to_dict)
    try:
        return datetime.fromisoformat(text).date().isoformat()
    except ValueError:
        pass
    for pattern in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(text, pattern).date().isoformat()
        except ValueError:
            continue
    return text


def _looks_numeric_like(value: Any) -> bool:
    text = clean_text(value)
    if not text:
        return True
    compact = text.replace("$", "").replace("%", "").replace(",", "").replace("-", "").replace(".", "")
    return compact.isdigit()


def _looks_date_like(value: Any) -> bool:
    text = clean_text(value)
    if not text:
        return True
    if text.count("/") == 2 or text.count("-") == 2:
        return True
    for token in ("jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"):
        if token in text.lower():
            return True
    return False


def assess_row_quality(raw_record: Dict[str, Any], normalized: Dict[str, Any]) -> Dict[str, Any]:
    issues: List[str] = []
    repaired_fields: List[str] = []
    quarantined_fields: List[str] = []
    corrections: List[Dict[str, Any]] = []

    critical_fields = ["InitiativeID", "Engineer_ID", "Activity_Type", "Hours_Logged"]
    missing_critical = [field for field in critical_fields if not clean_text(normalized.get(field))]
    if missing_critical:
        for field in missing_critical:
            quarantined_fields.append(field)
            issues.append(f"Missing critical field: {field}")

    numeric_fields = [
        "CapEx_Eligible_Pct",
        "ActualSpend_USD",
        "BudgetAmount_USD",
        "ForecastSpend_USD",
        "CumulativeSpend_USD",
        "Variance_USD",
        "Variance_Pct",
        "Hours_Logged",
        "Miles_Driven",
        "DriveTests_Completed",
        "Milestones_Completed",
        "PassingUnits",
        "Asset_Life_Years",
        "Depreciation_Annual_USD",
    ]
    date_fields = ["ProjectStartDate", "ProjectEndDate"]
    text_fields = [
        "InitiativeID",
        "InitiativeName",
        "DivisionCode",
        "TechnologyGeneration",
        "FiscalYear",
        "FiscalMonth",
        "FiscalQuarter",
        "SiteCity",
        "SiteState",
        "SiteZipCode",
        "SiteSwitchCode",
        "RegionalSwitchCode",
        "RegionalMarket",
        "RegionalState",
        "OperationsCluster",
        "SpendType",
        "VZZ_CostClass",
        "VZZ_WorkType",
        "LaborSurvey_Category",
        "Engineer_ID",
        "Team",
        "Activity_Type",
        "Source_System",
        "Pre_Post_Flag",
        "Project_Status",
    ]

    for field in numeric_fields:
        raw_value = raw_record.get(field)
        normalized_value = normalized.get(field)
        if clean_text(raw_value) and not _looks_numeric_like(raw_value):
            issues.append(f"Non-numeric value found in numeric field {field}")
            quarantined_fields.append(field)
            corrections.append(
                {
                    "field": field,
                    "rawValue": raw_value,
                    "normalizedValue": normalized_value,
                    "reason": "Expected numeric content; value was preserved in raw_fields and normalized conservatively.",
                }
            )

    for field in date_fields:
        raw_value = raw_record.get(field)
        normalized_value = normalized.get(field)
        if clean_text(raw_value) and normalized_value and clean_text(normalized_value) == clean_text(raw_value) and not _looks_date_like(raw_value):
            issues.append(f"Unparseable date-like value in {field}")
            repaired_fields.append(field)
            corrections.append(
                {
                    "field": field,
                    "rawValue": raw_value,
                    "normalizedValue": normalized_value,
                    "reason": "Date could not be normalized confidently; record should be reviewed.",
                }
            )

    for field in text_fields:
        raw_value = raw_record.get(field)
        if clean_text(raw_value) and (_looks_date_like(raw_value) and field not in date_fields):
            issues.append(f"Suspicious date-like value in text field {field}")
            quarantined_fields.append(field)
            corrections.append(
                {
                    "field": field,
                    "rawValue": raw_value,
                    "normalizedValue": normalized.get(field),
                    "reason": "Possible column displacement or entry in adjacent field.",
                }
            )

    if len(issues) >= 3 or missing_critical:
        status = "quarantined"
    elif issues:
        status = "repairable"
    else:
        status = "clean"

    return {
        "status": status,
        "issues": issues,
        "repairedFields": repaired_fields,
        "quarantinedFields": quarantined_fields,
        "corrections": corrections,
    }


def canonical_key(record: Dict[str, Any]) -> str:
    initiative_id = clean_text(record.get("InitiativeID")) or "unknown"
    fiscal_year = clean_text(record.get("FiscalYear")) or "year"
    fiscal_month = str(to_int(record.get("FiscalMonth")) or "period")
    return "-".join([initiative_id, fiscal_year, fiscal_month])


def normalize_numeric_fields(record: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(record)
    for field in [
        "InitiativeID",
        "InitiativeName",
        "DivisionCode",
        "TechnologyGeneration",
        "FiscalYear",
        "FiscalMonth",
        "FiscalQuarter",
        "ProjectStartDate",
        "ProjectEndDate",
        "SiteCity",
        "SiteState",
        "SiteZipCode",
        "SiteSwitchCode",
        "RegionalSwitchCode",
        "RegionalMarket",
        "RegionalState",
        "OperationsCluster",
        "SpendType",
        "VZZ_CostClass",
        "VZZ_WorkType",
        "LaborSurvey_Category",
        "Engineer_ID",
        "Team",
        "Activity_Type",
        "Source_System",
        "Pre_Post_Flag",
        "Project_Status",
    ]:
        normalized[field] = clean_text(normalized.get(field)) or None
    for field in [
        "CapEx_Eligible_Pct",
        "ActualSpend_USD",
        "BudgetAmount_USD",
        "ForecastSpend_USD",
        "CumulativeSpend_USD",
        "Variance_USD",
        "Variance_Pct",
        "Hours_Logged",
        "Miles_Driven",
        "DriveTests_Completed",
        "Milestones_Completed",
        "PassingUnits",
        "Asset_Life_Years",
        "Depreciation_Annual_USD"
    ]:
        normalized[field] = to_number(normalized.get(field))
    for field in ["ProjectStartDate", "ProjectEndDate"]:
        normalized[field] = parse_date(normalized.get(field))
    return normalized


def infer_persona(record: Dict[str, Any], default_persona: str) -> str:
    # Prefer HR profile persona when available
    hr_persona = clean_text(record.get("hr_persona"))
    if hr_persona:
        return hr_persona
    team = clean_text(record.get("Team")).lower()
    if "network" in team:
        return "Network Engineering Annual Survey"
    if "fiber" in team or "wireless" in team:
        return "Network Deployment Survey"
    if "field" in team:
        return "Network Deployment Survey"
    return default_persona


def enrich_record(record: Dict[str, Any], source_type: str, source_file_name: str, rule_version: str, persona_name: str, extraction_confidence: float | None = None, raw_fields: Dict[str, Any] | None = None) -> Dict[str, Any]:
    from app.enrichment.hr_profile_stub import get_hr_profile

    normalized = normalize_numeric_fields(record)

    # Inject simulated HR profile keyed on Engineer_ID
    hr_profile = get_hr_profile(normalized.get("Engineer_ID"))
    normalized.update({k: v for k, v in hr_profile.items() if v is not None})

    normalized_fields = dict(normalized)
    record_key = canonical_key(normalized)
    missing_fields = [field for field in ["InitiativeID", "Engineer_ID", "Activity_Type", "Hours_Logged"] if not clean_text(normalized.get(field))]
    row_quality = assess_row_quality(raw_fields or record, normalized)
    quality = DataQuality(
        completenessScore=round((4 - len(missing_fields)) / 4, 2),
        missingFields=missing_fields,
        warnings=list(row_quality["issues"])
    )
    record_model = NormalizedActivityRecord(
        **normalized,
        key=record_key,
        source=source_type,
        source_file_name=source_file_name,
        source_record_id=clean_text(normalized.get("_sourceRecordId")) or clean_text((raw_fields or {}).get("_sourceRecordId")) or None,
        rule_version=rule_version,
        persona=infer_persona(normalized, persona_name),
        normalized_at=datetime.utcnow().isoformat() + "Z",
        extraction_confidence=round((extraction_confidence or 1.0) * 100, 2),
        raw_fields=raw_fields or dict(record),
        normalized_fields=normalized_fields,
        data_quality=quality,
        row_quality=row_quality,
        form_validation=dict(record.get("_formValidation") or {}),
        matched_excel=int(record.get("_matchedExcel", 0))
    )
    if hasattr(record_model, "model_dump"):
        return record_model.model_dump(by_alias=True)
    return record_model.dict(by_alias=True)
