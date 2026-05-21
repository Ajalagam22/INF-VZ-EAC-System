from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

from app.config.settings import get_settings
from app.enrichment.pipeline import clean_text, to_number

SETTINGS = get_settings()
RULE_VERSION = SETTINGS.rule_version


def _signal(label: str, impact: int, kind: str) -> Dict[str, Any]:
    return {"label": label, "impact": impact, "kind": kind}


def evaluate_record(record: Dict[str, Any]) -> Tuple[int, List[Dict[str, Any]], str]:
    capex_eligible = to_number(record.get("CapEx_Eligible_Pct"))
    actual_spend = to_number(record.get("ActualSpend_USD"))
    hours = to_number(record.get("Hours_Logged"))
    milestones = to_number(record.get("Milestones_Completed"))
    drive_tests = to_number(record.get("DriveTests_Completed"))
    passing_units = to_number(record.get("PassingUnits"))
    asset_life = to_number(record.get("Asset_Life_Years"))
    activity = clean_text(record.get("Activity_Type")).lower()
    category = clean_text(record.get("LaborSurvey_Category")).lower()
    cost_class = clean_text(record.get("VZZ_CostClass")).lower()
    work_type = clean_text(record.get("VZZ_WorkType")).lower()
    spend_type = clean_text(record.get("SpendType")).lower()
    project_status = clean_text(record.get("Project_Status")).lower()
    all_text = " ".join([activity, category, cost_class, work_type, spend_type, project_status])

    signals: List[Dict[str, Any]] = []
    score = 50

    if capex_eligible >= 70:
        score += 18
        signals.append(_signal(f"{round(capex_eligible)}% capital-eligible labor signal", 18, "capex"))
    elif 0 < capex_eligible <= 35:
        score -= 14
        signals.append(_signal(f"{round(capex_eligible)}% capital eligibility points to expense treatment", -14, "opex"))

    if re.search(r"capital|capex|greenfield|expansion|build|fiber|upgrade|deployment|implementation", all_text):
        score += 18
        signals.append(_signal("capital build, deployment, or expansion language detected", 18, "capex"))
    if re.search(r"design|engineering|construction|site survey|drive test|milestone|acceptance|activation", all_text):
        score += 14
        signals.append(_signal("activity maps to direct asset creation or acceptance work", 14, "capex"))
    if re.search(r"maintenance|repair|support|incident|monitoring|troubleshooting|break.?fix|operations", all_text):
        score -= 20
        signals.append(_signal("operational support or maintenance language detected", -20, "opex"))
    if re.search(r"admin|coordination|reporting|po processing|meeting|status update|training", all_text):
        score -= 12
        signals.append(_signal("administrative or coordination activity reduces capitalization support", -12, "opex"))
    if milestones > 0 or drive_tests > 0 or passing_units > 0:
        score += 8
        signals.append(_signal("field, milestone, or unit evidence supports traceability", 8, "quality"))
    if asset_life >= 2:
        score += 6
        signals.append(_signal(f"{asset_life}-year asset life supports long-lived asset rationale", 6, "policy"))
    if not hours or not activity or not clean_text(record.get("InitiativeID")):
        score -= 16
        signals.append(_signal("missing labor, activity, or initiative fields lowers defensibility", -16, "quality"))
    if not actual_spend and not capex_eligible:
        score -= 8
        signals.append(_signal("limited financial context reduces confidence", -8, "quality"))

    bounded = max(0, min(100, score))
    evidence = "; ".join(signal["label"] for signal in sorted(signals, key=lambda item: abs(item["impact"]), reverse=True)[:3])
    return bounded, signals, evidence or "No strong capitalization signal available."


def classify_score(score: int, review_threshold: int | None = None) -> str:
    threshold = review_threshold if review_threshold is not None else SETTINGS.review_threshold
    classification = "CapEx" if score >= 66 else "OpEx" if score <= 42 else "Review"
    if classification != "OpEx" and score < threshold:
        return "Review"
    return classification
