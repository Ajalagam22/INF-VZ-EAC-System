"use client";

import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Database,
  FileSpreadsheet,
  FileText,
  GitBranch,
  ListChecks,
  Network,
  RefreshCw,
  Route,
  SearchCheck,
  ShieldCheck,
  TableProperties,
  UploadCloud,
  Users,
  type LucideIcon
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { appConfig } from "../config/appConfig";

type Classification = "CapEx" | "OpEx" | "Review";
type RawRecord = Record<string, unknown>;
type TabId =
  | "dashboard"
  | "sources"
  | "records"
  | "review"
  | "audit"
  | "learning"
  | "analytics";

type Signal = {
  label: string;
  impact: number;
  kind: "capex" | "opex" | "quality" | "policy";
};

type ClassifiedRecord = RawRecord & {
  _id: string;
  _recordUid?: string;
  _key: string;
  _classification: Classification;
  _confidence: number;
  _evidence: string;
  _reviewReason: string;
  _source: "Excel" | "DOCX form";
  _sourceRecordId?: string;
  _sourceFileName?: string;
  _signals: Signal[];
  _ruleVersion: string;
  _persona: string;
  _normalizedAt: string;
  _formValidation?: {
    extractedFields: number;
    totalFields: number;
  };
  _rowQuality?: {
    status: "clean" | "repairable" | "quarantined";
    issues: string[];
    repairedFields: string[];
    quarantinedFields: string[];
    corrections: Array<Record<string, unknown>>;
  };
  _processingStatus?: "quarantined";
  _matchedExcel?: number | boolean;
  _extractionConfidence?: number;
  _override?: Classification;
  _overrideNote?: string;
  _agentTrace?: {
    provider: string;
    model: string;
    steps: Array<{
      agent: string;
      status: string;
      summary: string;
      provider: string;
      output: Record<string, unknown>;
    }>;
  };
  _confidenceAdjusted?: number;
};

type FormValidation = {
  fileName: string;
  key: string;
  extractedFields: number;
  totalFields: number;
  matchedExcel: boolean;
  confidence: number;
};

type ExcelWorkbookSections = {
  datasetRows: RawRecord[];
  definitionRows: RawRecord[];
  mappingRows: RawRecord[];
  sheetNames: string[];
};

type IngestionManifest = {
  run_id: string;
  source_type: string;
  source_file_name: string;
  records_processed: number;
  records_classified: number;
  records_quarantined: number;
  records_escalated: number;
  records_failed: number;
  matched_excel: number;
  elapsed_seconds: number;
  agent_timings: Record<string, number>;
  errors: string[];
};

type IngestionJobSubmission = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  status_url: string;
  source_type: "Excel" | "DOCX form";
  source_file_name: string;
  created_at: string;
  stage: string;
};

type IngestionJobStatus = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  source_type: "Excel" | "DOCX form";
  source_file_name: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  stage: string;
  attempts: number;
  processed: number;
  classified: number;
  quarantined: number;
  escalated: number;
  failed: number;
  matched_excel: number;
  elapsed_seconds: number;
  run_id: string | null;
  manifest: IngestionManifest | null;
  result: {
    run_id: string;
    source_type: string;
    source_file_name: string;
    processed: number;
    classified: number;
    escalated: number;
    failed: number;
    matched_excel: number;
    elapsed_seconds: number;
    records: ClassifiedRecord[];
    manifest: IngestionManifest | null;
    agent_trace: Record<string, unknown>[];
  } | null;
  error: string | null;
};

const RULE_VERSION = appConfig.ruleVersion;
const REVIEW_THRESHOLD = appConfig.reviewThreshold;

const formFieldMap = [
  ["InitiativeID", /Initiative ID:\s*([^.\n]+)/i],
  ["InitiativeName", /Initiative Name:\s*([^.\n]+)/i],
  ["DivisionCode", /Division Code:\s*([^.\n]+)/i],
  ["TechnologyGeneration", /Technology Generation:\s*([^.\n]+)/i],
  ["FiscalYear", /Fiscal Year:\s*([^.\n]+)/i],
  ["FiscalMonth", /Fiscal Month:\s*([^(.\n]+)/i],
  ["FiscalQuarter", /Fiscal Quarter:\s*([^.\n]+)/i],
  ["ProjectStartDate", /Project Start Date:\s*([^.\n]+)/i],
  ["ProjectEndDate", /Project End Date:\s*([^.\n]+)/i],
  ["SiteCity", /Site City:\s*([^.\n]+)/i],
  ["SiteState", /Site State:\s*([^.\n]+)/i],
  ["SiteZipCode", /Site ZIP Code:\s*([^.\n]+)/i],
  ["SiteSwitchCode", /Site Switch Code:\s*([^.\n]+)/i],
  ["RegionalSwitchCode", /Regional Switch Code:\s*([^.\n]+)/i],
  ["RegionalMarket", /Regional Market:\s*([^.\n]+)/i],
  ["RegionalState", /Regional State:\s*([^.\n]+)/i],
  ["OperationsCluster", /Operations Cluster:\s*([^.\n]+)/i],
  ["SpendType", /Spend Type:\s*([^.\n]+)/i],
  ["VZZ_CostClass", /VZZ Cost Class:\s*([^.\n]+)/i],
  ["VZZ_WorkType", /VZZ Work Type:\s*([^.\n]+)/i],
  ["LaborSurvey_Category", /Labor Survey Category:\s*([^.\n]+)/i],
  ["CapEx_Eligible_Pct", /CapEx Eligible Percentage:\s*([-0-9,.]+%?)/i],
  ["BudgetAmount_USD", /Budget Amount:\s*(-?\$?[0-9,]+(?:\.\d+)?)/i],
  ["ActualSpend_USD", /Actual Spend:\s*(-?\$?[0-9,]+(?:\.\d+)?)/i],
  ["ForecastSpend_USD", /Forecast Spend:\s*(-?\$?[0-9,]+(?:\.\d+)?)/i],
  ["CumulativeSpend_USD", /Cumulative Spend:\s*(-?\$?[0-9,]+(?:\.\d+)?)/i],
  ["PassingUnits", /Passing Units:\s*([-0-9,.]+)/i],
  ["Asset_Life_Years", /Asset Life:\s*([-0-9,.]+)/i],
  ["Depreciation_Annual_USD", /Annual Depreciation:\s*(-?\$?[0-9,]+(?:\.\d+)?)/i],
  ["Engineer_ID", /Engineer ID:\s*([^.\n]+)/i],
  ["Team", /Team:\s*([^.\n]+)/i],
  ["Hours_Logged", /Hours Logged:\s*([-0-9,.]+)/i],
  ["Activity_Type", /Activity Type:\s*([^.\n]+)/i],
  ["Source_System", /Source System:\s*([^.\n]+)/i],
  ["Miles_Driven", /Miles Driven:\s*([-0-9,.]+)/i],
  ["DriveTests_Completed", /Drive Tests Completed:\s*([-0-9,.]+)/i],
  ["Pre_Post_Flag", /Pre\/Post Flag:\s*([^.\n]+)/i],
  ["Milestones_Completed", /Milestones Completed:\s*([-0-9,.]+)/i],
  ["Project_Status", /Project Status:\s*([^.\n]+)/i]
] as const;

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: unknown): number {
  const cleaned = cleanText(value).replace(/[$,%]/g, "").replace(/,/g, "");
  const negative = cleaned.includes("-$") || cleaned.startsWith("-");
  const parsed = Number(cleaned.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(parsed)) return 0;
  return negative ? -parsed : parsed;
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function pct(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function parseComparableDate(value: unknown): number | null {
  const text = cleanText(value);
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    return Date.UTC(year, month - 1, day);
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : parsed;
}

function compareFieldValues(fieldName: string, left: unknown, right: unknown): boolean {
  const leftText = cleanText(left);
  const rightText = cleanText(right);
  if (!leftText && !rightText) return true;
  if (fieldName.toLowerCase().includes("date")) {
    const leftDate = parseComparableDate(leftText);
    const rightDate = parseComparableDate(rightText);
    if (leftDate !== null && rightDate !== null) return leftDate === rightDate;
  }
  const leftNumber = Number(leftText.replace(/[$,%]/g, "").replace(/,/g, ""));
  const rightNumber = Number(rightText.replace(/[$,%]/g, "").replace(/,/g, ""));
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftText !== "" && rightText !== "") {
    return leftNumber === rightNumber;
  }
  return leftText.toLowerCase() === rightText.toLowerCase();
}

function formatFieldValue(value: unknown): string {
  const text = cleanText(value);
  return text || "—";
}

function scoreMappingMatch(formRecord: RawRecord, mappingRecord: RawRecord): number {
  return formFieldMap.reduce((score, [field]) => {
    const fieldName = field as keyof RawRecord;
    return score + (compareFieldValues(field, formRecord[fieldName], mappingRecord[fieldName]) ? 1 : 0);
  }, 0);
}

function findBestMappingMatch(formRecord: RawRecord, mappingRows: RawRecord[]): { mappingRecord?: RawRecord; score: number } {
  let bestScore = -1;
  let bestRecord: RawRecord | undefined;
  for (const candidate of mappingRows) {
    const score = scoreMappingMatch(formRecord, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestRecord = candidate;
    }
  }
  return { mappingRecord: bestRecord, score: Math.max(0, bestScore) };
}

function excelSerialToIso(serial: number): string {
  // Excel serial: days since 1899-12-30 (accounts for Lotus 1-2-3 leap-year bug)
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DATE_FIELDS = ["ProjectStartDate", "ProjectEndDate"];

function coerceDates(rows: RawRecord[]): RawRecord[] {
  return rows.map((row) => {
    const out: RawRecord = { ...row };
    for (const field of DATE_FIELDS as (keyof RawRecord)[]) {
      const val = row[field];
      if (typeof val === "number" && val > 1000) {
        (out as Record<string, unknown>)[field] = excelSerialToIso(val);
      }
    }
    return out;
  });
}

async function readExcelWorkbookSections(buffer: ArrayBuffer): Promise<ExcelWorkbookSections> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const [datasetSheetName, definitionSheetName, mappingSheetName] = workbook.SheetNames;
  const readSheet = (sheetName?: string): RawRecord[] => {
    if (!sheetName || !workbook.Sheets[sheetName]) return [];
    const rows = XLSX.utils.sheet_to_json<RawRecord>(workbook.Sheets[sheetName], { defval: "" });
    return coerceDates(rows);
  };
  return {
    datasetRows: readSheet(datasetSheetName),
    definitionRows: readSheet(definitionSheetName),
    mappingRows: readSheet(mappingSheetName),
    sheetNames: workbook.SheetNames
  };
}

function recordKey(record: RawRecord): string {
  return [
    cleanText(record.InitiativeID) || "unknown",
    cleanText(record.FiscalYear) || "year",
    Math.trunc(toNumber(record.FiscalMonth)).toString() || "period"
  ].join("-");
}

function pushSignal(signals: Signal[], label: string, impact: number, kind: Signal["kind"]) {
  signals.push({ label, impact, kind });
}

function classifyRecord(record: RawRecord, source: "Excel" | "DOCX form", index = 0): ClassifiedRecord {
  const capexEligible = toNumber(record.CapEx_Eligible_Pct);
  const actualSpend = toNumber(record.ActualSpend_USD);
  const hours = toNumber(record.Hours_Logged);
  const milestones = toNumber(record.Milestones_Completed);
  const driveTests = toNumber(record.DriveTests_Completed);
  const passingUnits = toNumber(record.PassingUnits);
  const assetLife = toNumber(record.Asset_Life_Years);
  const activity = cleanText(record.Activity_Type).toLowerCase();
  const category = cleanText(record.LaborSurvey_Category).toLowerCase();
  const costClass = cleanText(record.VZZ_CostClass).toLowerCase();
  const workType = cleanText(record.VZZ_WorkType).toLowerCase();
  const spendType = cleanText(record.SpendType).toLowerCase();
  const projectStatus = cleanText(record.Project_Status).toLowerCase();
  const allText = `${activity} ${category} ${costClass} ${workType} ${spendType} ${projectStatus}`;
  const signals: Signal[] = [];

  let score = 50;
  if (capexEligible >= 70) {
    score += 18;
    pushSignal(signals, `${Math.round(capexEligible)}% capital-eligible labor signal`, 18, "capex");
  } else if (capexEligible > 0 && capexEligible <= 35) {
    score -= 14;
    pushSignal(signals, `${Math.round(capexEligible)}% capital eligibility points to expense treatment`, -14, "opex");
  }

  if (/capital|capex|greenfield|expansion|build|fiber|upgrade|deployment|implementation/.test(allText)) {
    score += 18;
    pushSignal(signals, "capital build, deployment, or expansion language detected", 18, "capex");
  }
  if (/design|engineering|construction|site survey|drive test|milestone|acceptance|activation/.test(allText)) {
    score += 14;
    pushSignal(signals, "activity maps to direct asset creation or acceptance work", 14, "capex");
  }
  if (/maintenance|repair|support|incident|monitoring|troubleshooting|break.?fix|operations/.test(allText)) {
    score -= 20;
    pushSignal(signals, "operational support or maintenance language detected", -20, "opex");
  }
  if (/admin|coordination|reporting|po processing|meeting|status update|training/.test(allText)) {
    score -= 12;
    pushSignal(signals, "administrative or coordination activity reduces capitalization support", -12, "opex");
  }
  if (milestones > 0 || driveTests > 0 || passingUnits > 0) {
    score += 8;
    pushSignal(signals, "field, milestone, or unit evidence supports traceability", 8, "quality");
  }
  if (assetLife >= 2) {
    score += 6;
    pushSignal(signals, `${assetLife}-year asset life supports long-lived asset rationale`, 6, "policy");
  }
  if (!hours || !activity || !cleanText(record.InitiativeID)) {
    score -= 16;
    pushSignal(signals, "missing labor, activity, or initiative fields lowers defensibility", -16, "quality");
  }
  if (!actualSpend && !capexEligible) {
    score -= 8;
    pushSignal(signals, "limited financial context reduces confidence", -8, "quality");
  }

  const bounded = Math.max(0, Math.min(100, score));
  const conflicting = signals.some((s) => s.impact > 0) && signals.some((s) => s.impact < 0);
  let classification: Classification = bounded >= 66 ? "CapEx" : bounded <= 42 ? "OpEx" : "Review";
  const distance = Math.abs(bounded - 50);
  let confidence = Math.max(40, Math.min(98, Math.round(42 + distance * 1.08 + signals.length * 3)));
  if (conflicting) confidence -= 10;
  if (source === "DOCX form") confidence -= 4;
  confidence = Math.max(36, Math.min(98, confidence));
  if (confidence < REVIEW_THRESHOLD && classification !== "OpEx") classification = "Review";

  const evidenceSignals = signals
    .slice()
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3)
    .map((signal) => signal.label);

  const reviewReason =
    classification === "Review"
      ? conflicting
        ? "Conflicting CapEx and OpEx signals require domain lead review."
        : "Confidence below routing threshold; hold for human review."
      : confidence < 76
        ? "Ready for employee review with spot-check recommendation."
        : "High-confidence classification ready for output queue.";

  return {
    ...record,
    _id: `${source}-${recordKey(record)}-${index}`,
    _key: recordKey(record),
    _classification: classification,
    _confidence: confidence,
    _evidence:
      evidenceSignals.join("; ") ||
      "Fallback policy used because the uploaded record had limited classification signals.",
    _reviewReason: reviewReason,
    _source: source,
    _signals: signals,
    _ruleVersion: RULE_VERSION,
    _persona: appConfig.personaName,
    _normalizedAt: new Date().toISOString()
  };
}

function normalizeExcelRows(rows: RawRecord[]): ClassifiedRecord[] {
  return rows
    .filter((row) => cleanText(row.InitiativeID) || cleanText(row.Engineer_ID))
    .map((row, index) => classifyRecord(row, "Excel", index));
}

async function extractDocxText(zipEntry: ArrayBuffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const docxZip = await JSZip.loadAsync(zipEntry);
  const xml = await docxZip.file("word/document.xml")?.async("string");
  if (!xml) return "";
  const parsed = new DOMParser().parseFromString(xml, "text/xml");
  // Group text runs by paragraph so each field stays on its own line
  return Array.from(parsed.getElementsByTagName("w:p"))
    .map((para) =>
      Array.from(para.getElementsByTagName("w:t"))
        .map((node) => node.textContent ?? "")
        .join("")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

function extractFormRecord(text: string): { record: RawRecord; extracted: number } {
  const record: RawRecord = {};
  let extracted = 0;
  for (const [field, regex] of formFieldMap) {
    const match = text.match(regex);
    if (match?.[1]) {
      extracted += 1;
      record[field] = cleanText(match[1]);
    } else {
      record[field] = null;
    }
  }
  for (const field of [
    "CapEx_Eligible_Pct",
    "ActualSpend_USD",
    "BudgetAmount_USD",
    "ForecastSpend_USD",
    "CumulativeSpend_USD",
    "Hours_Logged",
    "Miles_Driven",
    "DriveTests_Completed",
    "Milestones_Completed",
    "PassingUnits",
    "Asset_Life_Years",
    "Depreciation_Annual_USD"
  ]) {
    record[field] = toNumber(record[field]);
  }
  return { record, extracted };
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "warn" | "danger" | "blue" | "neutral" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function MetricCard({
  label,
  value,
  hint,
  Icon,
  tone = "blue"
}: {
  label: string;
  value: string | number;
  hint: string;
  Icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <label>{label}</label>
      <strong>{value}</strong>
      <span>{hint}</span>
    </div>
  );
}

export default function Home() {
  const [excelRecords, setExcelRecords] = useState<ClassifiedRecord[]>([]);
  const [formRecords, setFormRecords] = useState<ClassifiedRecord[]>([]);
  const [validations, setValidations] = useState<FormValidation[]>([]);
  const [status, setStatus] = useState("Select a file, then run the corresponding job.");
  const [pendingExcelFile, setPendingExcelFile] = useState<File | null>(null);
  const [pendingFormFile, setPendingFormFile] = useState<File | null>(null);
  const [excelDragOver, setExcelDragOver] = useState(false);
  const [formsDragOver, setFormsDragOver] = useState(false);
  const [excelRunning, setExcelRunning] = useState(false);
  const [formsRunning, setFormsRunning] = useState(false);
  const [runHistory, setRunHistory] = useState<Array<{
    runId: string; sourceType: string; fileName: string;
    recordCount: number; elapsed: number; ts: string;
  }>>([]);
  const [excelWorkbookSections, setExcelWorkbookSections] = useState<ExcelWorkbookSections>({
    datasetRows: [],
    definitionRows: [],
    mappingRows: [],
    sheetNames: []
  });
  const [selectedFormKey, setSelectedFormKey] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [sourcesSubTab, setSourcesSubTab] = useState<"connectors" | "pipeline" | "validation">("connectors");
  const [filter, setFilter] = useState<Classification | "All">("All");

  // Restore records from backend on load so a page refresh doesn't lose data
  useEffect(() => {
    if (!appConfig.apiBaseUrl) return;
    fetch(`${appConfig.apiBaseUrl}/api/records`)
      .then((r) => r.ok ? r.json() : [])
      .then((raw: unknown) => {
        const data: ClassifiedRecord[] = Array.isArray(raw) ? raw : ((raw as {records?: ClassifiedRecord[]})?.records ?? []);
        if (data.length === 0) return;
        const excel = data.filter((r) => r._source === "Excel");
        const forms = data.filter((r) => r._source === "DOCX form");
        if (excel.length > 0) setExcelRecords(excel);
        if (forms.length > 0) {
          setFormRecords(forms);
          // Rebuild validations from the stored _matchedExcel / _extractionConfidence fields —
          // no need for the workbook rows since _matchedExcel is already authoritative.
          setValidations(buildFormValidations(forms, []));
        }
        if (excel.length + forms.length > 0) setStatus(`Restored ${excel.length} Excel + ${forms.length} form records from previous session.`);
        const history: typeof runHistory = [];
        if (forms.length > 0) history.push({
          runId: "restored-docx",
          sourceType: "DOCX form",
          fileName: (forms[0]._sourceFileName as string) ?? "forms",
          recordCount: forms.length,
          elapsed: 0,
          ts: new Date().toISOString()
        });
        if (excel.length > 0) history.push({
          runId: "restored-excel",
          sourceType: "Excel",
          fileName: (excel[0]._sourceFileName as string) ?? "excel",
          recordCount: excel.length,
          elapsed: 0,
          ts: new Date().toISOString()
        });
        if (history.length > 0) setRunHistory(history);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const records = useMemo(() => [...excelRecords, ...formRecords], [excelRecords, formRecords]);
  const filteredRecords = records.filter((record) => {
    const finalClass = record._override ?? record._classification;
    return filter === "All" || finalClass === filter;
  });
  const reviewRecords = records.filter((record) => !record._override && ((record._classification) === "Review" || record._confidence < REVIEW_THRESHOLD));
  const feedbackEvents = records.filter((record) => record._override);

  const metrics = useMemo(() => {
    const total = records.length;
    const capex = records.filter((record) => (record._override ?? record._classification) === "CapEx").length;
    const opex = records.filter((record) => (record._override ?? record._classification) === "OpEx").length;
    const review = records.filter((record) => (record._override ?? record._classification) === "Review").length;
    const hours = records.reduce((sum, record) => sum + toNumber(record.Hours_Logged), 0);
    const capexHours = records.reduce((sum, record) => {
      const finalClass = record._override ?? record._classification;
      return sum + (finalClass === "CapEx" ? toNumber(record.Hours_Logged) : 0);
    }, 0);
    const capexDollars = records.reduce((sum, record) => {
      const finalClass = record._override ?? record._classification;
      const spend = Math.max(0, toNumber(record.ActualSpend_USD));
      return sum + (finalClass === "CapEx" ? spend : 0);
    }, 0);
    const avgConfidence = total
      ? Math.round(records.reduce((sum, record) => sum + record._confidence, 0) / total)
      : 0;
    const overrides = records.filter((record) => record._override).length;
    const uniqueEngineers = new Set(records.map((record) => cleanText(record.Engineer_ID)).filter(Boolean)).size;
    const quarantined = records.filter((record) => record._processingStatus === "quarantined" || record._rowQuality?.status === "quarantined").length;
    return { total, capex, opex, review, quarantined, hours, capexHours, capexDollars, avgConfidence, overrides, uniqueEngineers };
  }, [records]);

  const validationRate = validations.length
    ? Math.round((validations.filter((item) => item.matchedExcel).length / validations.length) * 100)
    : 0;
  const validationSourceRows = excelWorkbookSections.mappingRows.length ? excelWorkbookSections.mappingRows : excelRecords;
  const selectedFormComparison = useMemo(() => {
    const fallbackKey = validations.find((item) => item.matchedExcel)?.key ?? validations[0]?.key ?? formRecords[0]?._key ?? "";
    const activeKey = selectedFormKey || fallbackKey;
    const formRecord = formRecords.find((record) => record._key === activeKey);
    if (!formRecord) return null;
    const exactMatch = findBestMappingMatch(formRecord, validationSourceRows);
    const mappingRecord = exactMatch.mappingRecord;
    const rows = formFieldMap.map(([field]) => {
      const fieldName = field as keyof RawRecord;
      const formValue = formRecord[fieldName];
      const excelValue = mappingRecord?.[fieldName];
      return {
        field,
        formValue,
        excelValue,
        match: compareFieldValues(field, formValue, excelValue)
      };
    });
    return {
      key: activeKey,
      formRecord,
      mappingRecord,
      rows,
      matchedCount: rows.filter((row) => row.match).length,
      totalCount: rows.length
    };
  }, [formRecords, selectedFormKey, validationSourceRows, validations]);
  const distributionSegments = useMemo(() => {
    const total = Math.max(1, metrics.capex + metrics.opex + metrics.review);
    const segments = [
      { label: "CapEx", value: metrics.capex, tone: "good" as const, color: "#12b76a" },
      { label: "OpEx", value: metrics.opex, tone: "blue" as const, color: "#1a73e8" },
      { label: "Review", value: metrics.review, tone: "warn" as const, color: "#f79009" }
    ];
    return segments.map((segment) => ({
      ...segment,
      percentage: (segment.value / total) * 100,
      total
    }));
  }, [metrics.capex, metrics.opex, metrics.review]);
  const donutCircumference = 2 * Math.PI * 42;
  let donutOffset = 0;

  function buildFormValidations(records: ClassifiedRecord[], exactMappings: RawRecord[]): FormValidation[] {
    return records.map((record) => ({
      fileName: cleanText(record._sourceRecordId) || cleanText(record._sourceFileName) || record._key,
      key: record._key,
      extractedFields: Number(record._formValidation?.extractedFields ?? 0),
      totalFields: Number(record._formValidation?.totalFields ?? formFieldMap.length),
      // Use backend-authoritative matched flag when present; fall back to score-based check
      matchedExcel: record._matchedExcel === 1 || record._matchedExcel === true
        ? true
        : findBestMappingMatch(record, exactMappings).score >= Math.floor(formFieldMap.length * 0.4),
      confidence: Math.round(Number(record._extractionConfidence ?? 0))
    }));
  }

  function mergeUniqueRecords(existing: ClassifiedRecord[], incoming: ClassifiedRecord[]): ClassifiedRecord[] {
    const seen = new Map(existing.map((record) => [record._key, record]));
    for (const record of incoming) {
      if (!seen.has(record._key)) {
        seen.set(record._key, record);
      }
    }
    return Array.from(seen.values());
  }

  async function postFile(endpoint: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${appConfig.apiBaseUrl}${endpoint}`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json();
  }

  async function waitForJob(
    job: IngestionJobSubmission,
    label: string,
    onPartialRecords?: (records: ClassifiedRecord[], sourceType: string) => void
  ): Promise<IngestionJobStatus> {
    const statusUrl = `${appConfig.apiBaseUrl}${job.status_url}`;
    let lastStage = job.stage;
    let runId: string | null = null;
    let seenCount = 0;

    for (let attempt = 0; attempt < 600; attempt += 1) {
      const response = await fetch(statusUrl);
      if (!response.ok) throw new Error(await response.text());
      const state = (await response.json()) as IngestionJobStatus;

      if (state.run_id && !runId) runId = state.run_id;

      if (state.stage && state.stage !== lastStage) {
        setStatus(`${label} ${state.stage}...`);
        lastStage = state.stage;
      } else if (state.status === "processing") {
        setStatus(`${label} ${state.classified ?? 0} of ~${state.processed ?? 0} records classified...`);
      } else if (state.status === "queued") {
        setStatus(`${label} queued...`);
      }

      // Poll in-memory store every tick whenever we have a run_id
      if (runId && onPartialRecords && (state.status === "processing" || state.status === "completed")) {
        try {
          const partial = await fetch(`${appConfig.apiBaseUrl}/api/records/run/${runId}?offset=${seenCount}`);
          if (partial.ok) {
            const { records: newRecords } = await partial.json();
            if (newRecords?.length) {
              seenCount += newRecords.length;
              onPartialRecords(newRecords, job.source_type);
            }
          }
        } catch { /* non-fatal */ }
      }

      if (state.status === "completed") {
        if (!state.result) throw new Error("Ingestion job completed without a result payload.");
        return state;
      }
      if (state.status === "failed") return state;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("Timed out waiting for the ingestion job to complete.");
  }

  function hydrateExcelRecords(records: ClassifiedRecord[], fileName: string, exactMappings: RawRecord[]) {
    const classified = records.map((record, index) => ({
      ...record,
      _id: record._id ?? record._recordUid ?? `Excel-${index}`
    }));
    setExcelRecords(classified);
    setValidations(buildFormValidations(formRecords, exactMappings));
    if (!selectedId) setSelectedId(classified[0]?._id ?? "");
    setStatus(`Excel connector staged ${classified.length} records from ${fileName}; classification run complete.`);
  }

  function hydrateFormRecords(records: ClassifiedRecord[], fileName: string) {
    const parsedRecords = records.map((record, index) => ({
      ...record,
      _id: record._id ?? record._recordUid ?? `DOCX-${index}`
    }));
    const merged = mergeUniqueRecords(formRecords, parsedRecords);
    setFormRecords(merged);
    setValidations(buildFormValidations(merged, validationSourceRows));
    if (!selectedId) setSelectedId(merged[0]?._id ?? "");
    if (!selectedFormKey) setSelectedFormKey(merged[0]?._key ?? "");
    const matched = buildFormValidations(merged, validationSourceRows).filter((item) => item.matchedExcel).length;
    setStatus(
      `Form parser added ${parsedRecords.length} DOCX record${parsedRecords.length === 1 ? "" : "s"} from ${fileName}. Total forms loaded: ${merged.length}. ${
        matched ? `${matched} matched Excel validation keys.` : "Upload Excel to validate matching."
      }`
    );
  }

  async function runExcelUpload(file: File): Promise<{ count: number; elapsed: number }> {
    setStatus(`Queueing Excel ingestion job for ${file.name}...`);
    const buffer = await file.arrayBuffer();
    const workbookSections = await readExcelWorkbookSections(buffer);
    try {
      setExcelWorkbookSections(workbookSections);
      const submission = (await postFile("/api/upload/excel", file)) as IngestionJobSubmission;
      setStatus(`Excel ingestion job ${submission.job_id} queued. Waiting for the worker...`);
      const mappings = workbookSections.mappingRows.length ? workbookSections.mappingRows : workbookSections.datasetRows;
      const completed = await waitForJob(submission, "Excel ingestion", (partial) => {
        const hydrated = partial.map((r, i) => ({ ...r, _id: r._id ?? r._recordUid ?? `Excel-partial-${i}` }));
        setExcelRecords((prev) => {
          const seen = new Set(prev.map((r) => r._recordUid));
          return [...prev, ...hydrated.filter((r) => !seen.has(r._recordUid))];
        });
        setValidations(buildFormValidations(formRecords, mappings));
        if (!selectedId) setSelectedId(hydrated[0]?._id ?? "");
      });
      if (completed.status === "failed") {
        throw new Error(completed.error ?? "Excel ingestion job failed");
      }
      const records = completed.result?.records ?? [];
      hydrateExcelRecords(records, completed.result?.source_file_name ?? file.name, mappings);
      return { count: records.length, elapsed: completed.result?.elapsed_seconds ?? 0 };
    } catch {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames.includes("Data document for VZZ")
        ? "Data document for VZZ"
        : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<RawRecord>(worksheet, { defval: "" });
      setExcelWorkbookSections(workbookSections);
      const classified = normalizeExcelRows(rows);
      setExcelRecords(classified);
      setValidations(buildFormValidations(formRecords, workbookSections.mappingRows.length ? workbookSections.mappingRows : workbookSections.datasetRows));
      setSelectedId(classified[0]?._id ?? "");
      setStatus(`Excel connector staged ${classified.length} records from ${sheetName}; classification run complete.`);
      return { count: classified.length, elapsed: 0 };
    }
  }

  async function runFormsUpload(file: File): Promise<{ count: number; elapsed: number }> {
    setStatus(`Queueing form ingestion job for ${file.name}...`);
    try {
      const submission = (await postFile("/api/upload/forms", file)) as IngestionJobSubmission;
      setStatus(`Form ingestion job ${submission.job_id} queued. Waiting for the worker...`);
      const completed = await waitForJob(submission, "Form ingestion");
      if (completed.status === "failed") {
        throw new Error(completed.error ?? "Form ingestion job failed");
      }
      const records = completed.result?.records ?? [];
      hydrateFormRecords(records, completed.result?.source_file_name ?? file.name);
      return { count: records.length, elapsed: completed.result?.elapsed_seconds ?? 0 };
    } catch {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const parsedRecords: ClassifiedRecord[] = [];
      const docxFiles = Object.values(zip.files).filter(
        (entry) => {
          const baseName = entry.name.split("/").pop() ?? entry.name;
          return entry.name.endsWith(".docx") && !entry.name.startsWith("__MACOSX") && !baseName.startsWith("._");
        }
      );
      const seenNames = new Set<string>();
      const seenKeys = new Set<string>();

      for (let index = 0; index < docxFiles.length; index += 1) {
        const entry = docxFiles[index];
        const sourceName = entry.name.split("/").pop() ?? entry.name;
        if (seenNames.has(sourceName)) continue;
        seenNames.add(sourceName);
        const text = await extractDocxText(await entry.async("arraybuffer"));
        const { record, extracted } = extractFormRecord(text);
        const classified = classifyRecord(record, "DOCX form", index);
        classified._sourceRecordId = sourceName;
        classified._sourceFileName = file.name;
        classified._formValidation = {
          extractedFields: extracted,
          totalFields: formFieldMap.length
        };
        classified._extractionConfidence = Math.round((extracted / formFieldMap.length) * 100);
        if (seenKeys.has(classified._key)) continue;
        seenKeys.add(classified._key);
        parsedRecords.push(classified);
      }

      setFormRecords(parsedRecords);
      setValidations(buildFormValidations(parsedRecords, validationSourceRows));
      if (!selectedId) setSelectedId(parsedRecords[0]?._id ?? "");
      const matched = buildFormValidations(parsedRecords, validationSourceRows).filter((item) => item.matchedExcel).length;
      setStatus(
        `Form parser extracted ${parsedRecords.length} DOCX records. ${
          validationSourceRows.length ? `${matched} matched Excel validation keys.` : "Upload Excel to validate matching."
        }`
      );
      return { count: parsedRecords.length, elapsed: 0 };
    }
  }

  function selectExcelFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPendingExcelFile(file);
    setStatus(file ? `Selected Excel file ${file.name}. Click Import to process it.` : "Excel file cleared.");
  }

  function selectFormsFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPendingFormFile(file);
    setStatus(file ? `Selected form file ${file.name}. Click Import to process it.` : "Form file cleared.");
  }

  async function handleExcelUpload() {
    if (!pendingExcelFile) return;
    setExcelRunning(true);
    let result = { count: 0, elapsed: 0 };
    try { result = await runExcelUpload(pendingExcelFile); } finally { setExcelRunning(false); }
    setRunHistory((prev) => [{
      runId: Date.now().toString(36), sourceType: "Excel",
      fileName: pendingExcelFile.name, recordCount: result.count,
      elapsed: result.elapsed, ts: new Date().toISOString()
    }, ...prev.filter((r) => r.sourceType !== "Excel").slice(0, 8)]);
    setPendingExcelFile(null);
  }

  async function handleFormsUpload() {
    if (!pendingFormFile) return;
    setFormsRunning(true);
    let result = { count: 0, elapsed: 0 };
    try { result = await runFormsUpload(pendingFormFile); } finally { setFormsRunning(false); }
    setRunHistory((prev) => [{
      runId: Date.now().toString(36), sourceType: "DOCX form",
      fileName: pendingFormFile.name, recordCount: result.count,
      elapsed: result.elapsed, ts: new Date().toISOString()
    }, ...prev.filter((r) => r.sourceType !== "DOCX form").slice(0, 8)]);
    setPendingFormFile(null);
  }

  function handleExcelDrop(e: React.DragEvent) {
    e.preventDefault();
    setExcelDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      setPendingExcelFile(file);
      setStatus(`Selected Excel file ${file.name}. Click Run Sync to process it.`);
    }
  }

  function handleFormsDrop(e: React.DragEvent) {
    e.preventDefault();
    setFormsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".zip") || file.name.endsWith(".docx"))) {
      setPendingFormFile(file);
      setStatus(`Selected form file ${file.name}. Click Run Sync to process it.`);
    }
  }

  function overrideRecord(id: string, value: Classification | "", note = "Manual reviewer correction") {
    const update = (items: ClassifiedRecord[]) =>
      items.map((record) =>
        record._id === id
          ? { ...record, _override: value ? value : undefined, _overrideNote: value ? note : undefined }
          : record
      );
    setExcelRecords(update);
    setFormRecords(update);
    // Persist to backend audit log; fire-and-forget — UI already updated above
    const target = records.find((r) => r._id === id);
    if (target?._recordUid) {
      fetch(`${appConfig.apiBaseUrl}/api/records/${target._recordUid}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification: value || null, note })
      }).catch(() => {});
    }
  }

  const tabs: Array<{ id: TabId; label: string; Icon: LucideIcon; permission: string }> = [
    { id: "dashboard", label: "Dashboard", Icon: BarChart3, permission: "Finance Review" },
    { id: "records", label: "Activity Records", Icon: TableProperties, permission: "Classification" },
    { id: "review", label: "Review Queue", Icon: Route, permission: "Team Lead" },
    { id: "analytics", label: "Analytics", Icon: Activity, permission: "Insights" },
    { id: "audit", label: "Audit Trail", Icon: ListChecks, permission: "Compliance" },
    { id: "sources", label: "Data Sources", Icon: UploadCloud, permission: "Connector Ops" },
    { id: "learning", label: "Feedback Learning", Icon: RefreshCw, permission: "Governance" }
  ];

  return (
    <main className="app-shell">
      <aside className="left-rail">
        <div className="brand-block">
          <div className={`brand-mark ${appConfig.brandImageSrc ? "image-mark" : "brand-check"}`}>
            {appConfig.brandImageSrc ? (
              <img src={appConfig.brandImageSrc} alt={`${appConfig.brandName} logo`} />
            ) : (
              <span>V</span>
            )}
          </div>
          <div>
            <h1>EAC</h1>
            {appConfig.brandSubtitle ? <span>{appConfig.brandSubtitle}</span> : null}
          </div>
        </div>
        <nav className="nav-list" aria-label="EAC modules">
          {tabs.map(({ id, label, Icon }) => (
            <button
              className={`nav-item ${activeTab === id ? "active" : ""}`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="top-nav">
          <div className="top-status">
          </div>
        </header>

        <div className="content">
          {activeTab === "dashboard" && (
            <div className="page-stack">
              <PageHeader
                title={appConfig.appTitle}
                copy={appConfig.appDescription}
                Icon={BrainCircuit}
              />
              <section className="metric-grid">
                <MetricCard label="Records Processed" value={metrics.total} hint={`${metrics.uniqueEngineers || 0} employees in current run`} Icon={Database} />
                <MetricCard label="CapEx Share" value={pct(metrics.total ? (metrics.capex / metrics.total) * 100 : 0)} hint={`${metrics.capex} records classified as CapEx`} Icon={CheckCircle2} tone="green" />
                <MetricCard label="OpEx Share" value={pct(metrics.total ? (metrics.opex / metrics.total) * 100 : 0)} hint={`${metrics.opex} records classified as OpEx`} Icon={Archive} tone="amber" />
                <MetricCard label="Review Queue" value={reviewRecords.length} hint="Low-confidence or ambiguous records" Icon={AlertTriangle} tone="red" />
                <MetricCard label="Quarantined" value={metrics.quarantined} hint="Held back for missing or suspicious data" Icon={ShieldCheck} tone="amber" />
                <MetricCard label="Avg Confidence" value={metrics.avgConfidence || "N/A"} hint={`Routing threshold: ${REVIEW_THRESHOLD}`} Icon={SearchCheck} />
                <MetricCard label="Estimated CapEx Exposure" value={currency(metrics.capexDollars)} hint={`POC proxy from ${Math.round(metrics.capexHours)} CapEx-classified labor hours`} Icon={BarChart3} tone="green" />
                <MetricCard label="Conflict Rate" value={records.length ? `${Math.round((feedbackEvents.length / records.length) * 100)}%` : "N/A"} hint={`${feedbackEvents.length} correction${feedbackEvents.length === 1 ? "" : "s"} out of ${records.length} classifications`} Icon={AlertTriangle} tone={feedbackEvents.length > 0 ? "red" : undefined} />
              </section>

              <section className="split-grid">
                <div className="panel">
                  <PanelTitle title="CapEx / OpEx Distribution" copy="Baseline assumes 100% OpEx for unclassified labor; the engine surfaces records requiring capital labor review." Icon={BarChart3} />
                  <div className="distribution-card">
                    <div className="donut-wrap" aria-label="CapEx OpEx Review distribution">
                      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
                        <circle className="donut-track" cx="60" cy="60" r="42" />
                        {distributionSegments.map((segment) => {
                          const dashLength = (segment.percentage / 100) * donutCircumference;
                          const circle = (
                            <circle
                              key={segment.label}
                              cx="60"
                              cy="60"
                              r="42"
                              fill="none"
                              stroke={segment.color}
                              strokeWidth="14"
                              strokeDasharray={`${dashLength} ${donutCircumference - dashLength}`}
                              strokeDashoffset={-donutOffset}
                              strokeLinecap="butt"
                              transform="rotate(-90 60 60)"
                            />
                          );
                          donutOffset += dashLength;
                          return circle;
                        })}
                      </svg>
                      <div className="donut-center">
                        <strong>{metrics.total}</strong>
                        <span>records</span>
                      </div>
                    </div>
                    <div className="donut-legend">
                      {distributionSegments.map((segment) => (
                        <div className="donut-legend-row" key={segment.label}>
                          <span className="legend-swatch" style={{ background: segment.color }} />
                          <span>{segment.label}</span>
                          <strong>{pct(segment.percentage)}</strong>
                        </div>
                      ))}
                      <div className="donut-footnote">Quarantined: {metrics.quarantined}</div>
                    </div>
                  </div>
                </div>
                <div className="panel">
                  <PanelTitle title="Last Batch Summary" copy="The most recent import in this session, with batch-level processing and confidence statistics." Icon={ClipboardCheck} />
                  <div className="manifest-grid">
                    <Manifest label="Records parsed" value={metrics.total} />
                    <Manifest label="Classified" value={metrics.capex + metrics.opex} />
                    <Manifest label="Sent for review" value={metrics.review} />
                    <Manifest label="Quarantined" value={metrics.quarantined} />
                    <Manifest label="Avg confidence" value={metrics.avgConfidence ? `${metrics.avgConfidence}%` : "N/A"} />
                    <Manifest label="Form match rate" value={validations.length ? `${validationRate}%` : "Pending"} />
                    <Manifest label="Conflict rate" value={records.length ? `${Math.round((feedbackEvents.length / records.length) * 100)}%` : "N/A"} />
                  </div>
                  <p className="note">{status}</p>
                </div>
              </section>

              {/* Run history — full width */}
              <section className="panel">
                <PanelTitle title="Run History" copy="Batch run log — each upload triggers an on-demand run." Icon={ClipboardCheck} />
                {runHistory.length ? (
                  <div className="run-history-list">
                    {runHistory.map((run) => (
                      <div className="run-row" key={run.runId}>
                        <div className="run-dot" />
                        <div className="run-info">
                          <strong>{run.sourceType}</strong>
                          <span>{run.fileName}</span>
                        </div>
                        <div className="run-stats">
                          <span>{run.recordCount} records</span>
                          <span>{run.elapsed}s</span>
                        </div>
                        <div className="run-time">{new Date(run.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState copy="Run history appears here after each upload. The nightly batch scheduler surfaces all production runs." />
                )}
                <div className="next-run-banner">
                  <RefreshCw size={13} />
                  <span>Next scheduled run: <strong>02:00 AM</strong> nightly batch</span>
                  <Badge tone="neutral">Scheduler v2</Badge>
                </div>
              </section>


            </div>
          )}

          {activeTab === "sources" && (
            <div className="page-stack">
              <PageHeader title="Data Sources" copy="Connectors, enrichment pipeline, and form extraction validation." Icon={UploadCloud} />
              <div className="toolbar" style={{ marginBottom: 0 }}>
                <div className="segmented">
                  {(["connectors", "pipeline", "validation"] as const).map((t) => (
                    <button key={t} type="button" className={sourcesSubTab === t ? "active" : ""} onClick={() => setSourcesSubTab(t)}>
                      {t === "connectors" ? "Connectors" : t === "pipeline" ? "Classification Pipeline" : "Form Extraction Validation"}
                    </button>
                  ))}
                </div>
              </div>

              {sourcesSubTab === "connectors" && (
                <>
                  <section className="panel">
                    <PanelTitle title="Active Connectors" copy="Both produce the same NormalizedActivityRecord contract." Icon={Network} />
                    <div className="active-connector-grid">

                      {/* Excel connector */}
                      <div className={`ac-card${excelRunning ? " ac-running" : ""}`}>
                        <div className="ac-header">
                          <div className="ac-icon-wrap ac-excel">
                            <FileSpreadsheet size={20} />
                          </div>
                          <div className="ac-meta">
                            <div className="ac-name">Excel Dataset Connector</div>
                            <div className="ac-sub">Primary workflow source · .xlsx / .xls</div>
                          </div>
                          <div className="ac-status-dot" title="Connected" />
                        </div>
                        <div className="ac-stats">
                          <div className="ac-stat">
                            <span className="ac-stat-val">{excelRecords.length}</span>
                            <span className="ac-stat-label">records loaded</span>
                          </div>
                          <div className="ac-stat">
                            <span className="ac-stat-val">{excelRecords.filter((r) => (r._override ?? r._classification) === "CapEx").length}</span>
                            <span className="ac-stat-label">CapEx</span>
                          </div>
                          <div className="ac-stat">
                            <span className="ac-stat-val">{excelRecords.filter((r) => (r._override ?? r._classification) === "OpEx").length}</span>
                            <span className="ac-stat-label">OpEx</span>
                          </div>
                          <div className="ac-stat">
                            <span className="ac-stat-val">{excelRecords.filter((r) => (r._override ?? r._classification) === "Review").length}</span>
                            <span className="ac-stat-label">Review</span>
                          </div>
                        </div>
                        <label
                          className={`ac-dropzone${excelDragOver ? " drag-over" : ""}${pendingExcelFile ? " has-file" : ""}`}
                          onDragOver={(e) => { e.preventDefault(); setExcelDragOver(true); }}
                          onDragLeave={() => setExcelDragOver(false)}
                          onDrop={handleExcelDrop}
                        >
                          <input type="file" accept=".xlsx,.xls" onChange={selectExcelFile} style={{ display: "none" }} />
                          {pendingExcelFile ? (
                            <div className="ac-file-selected">
                              <FileSpreadsheet size={16} />
                              <span>{pendingExcelFile.name}</span>
                              <button type="button" className="ac-clear" onClick={(e) => { e.preventDefault(); setPendingExcelFile(null); }}>×</button>
                            </div>
                          ) : (
                            <div className="ac-drop-prompt">
                              <UploadCloud size={22} />
                              <span>Drop .xlsx here or <u>browse</u></span>
                            </div>
                          )}
                        </label>
                        {excelRunning && <div className="ac-progress-bar"><div className="ac-progress-fill" /></div>}
                        <div className="ac-footer">
                          <span className="ac-footer-hint">{excelRunning ? status : excelRecords.length ? `Last sync: ${excelRecords.length} records` : "No data synced yet"}</span>
                          <button
                            type="button"
                            className="ac-run-btn"
                            onClick={handleExcelUpload}
                            disabled={!pendingExcelFile || excelRunning}
                          >
                            {excelRunning ? "Syncing…" : "Run Sync"}
                          </button>
                        </div>
                      </div>

                      {/* Forms connector */}
                      <div className={`ac-card${formsRunning ? " ac-running" : ""}`}>
                        <div className="ac-header">
                          <div className="ac-icon-wrap ac-forms">
                            <FileText size={20} />
                          </div>
                          <div className="ac-meta">
                            <div className="ac-name">Form Document Parser</div>
                            <div className="ac-sub">Survey forms · .docx / .zip of DOCX</div>
                          </div>
                          <div className="ac-status-dot" title="Connected" />
                        </div>
                        <div className="ac-stats">
                          <div className="ac-stat">
                            <span className="ac-stat-val">{formRecords.length}</span>
                            <span className="ac-stat-label">records loaded</span>
                          </div>
                          <div className="ac-stat">
                            <span className="ac-stat-val">{formRecords.filter((r) => (r._override ?? r._classification) === "CapEx").length}</span>
                            <span className="ac-stat-label">CapEx</span>
                          </div>
                          <div className="ac-stat">
                            <span className="ac-stat-val">{formRecords.filter((r) => (r._override ?? r._classification) === "OpEx").length}</span>
                            <span className="ac-stat-label">OpEx</span>
                          </div>
                          <div className="ac-stat">
                            <span className="ac-stat-val">{validations.filter((v) => v.matchedExcel).length}</span>
                            <span className="ac-stat-label">matched</span>
                          </div>
                        </div>
                        <label
                          className={`ac-dropzone${formsDragOver ? " drag-over" : ""}${pendingFormFile ? " has-file" : ""}`}
                          onDragOver={(e) => { e.preventDefault(); setFormsDragOver(true); }}
                          onDragLeave={() => setFormsDragOver(false)}
                          onDrop={handleFormsDrop}
                        >
                          <input type="file" accept=".zip,.docx" onChange={selectFormsFile} style={{ display: "none" }} />
                          {pendingFormFile ? (
                            <div className="ac-file-selected">
                              <FileText size={16} />
                              <span>{pendingFormFile.name}</span>
                              <button type="button" className="ac-clear" onClick={(e) => { e.preventDefault(); setPendingFormFile(null); }}>×</button>
                            </div>
                          ) : (
                            <div className="ac-drop-prompt">
                              <UploadCloud size={22} />
                              <span>Drop .docx / .zip here or <u>browse</u></span>
                            </div>
                          )}
                        </label>
                        {formsRunning && <div className="ac-progress-bar"><div className="ac-progress-fill" /></div>}
                        <div className="ac-footer">
                          <span className="ac-footer-hint">{formsRunning ? status : formRecords.length ? `Last sync: ${formRecords.length} records` : "No data synced yet"}</span>
                          <button
                            type="button"
                            className="ac-run-btn"
                            onClick={handleFormsUpload}
                            disabled={!pendingFormFile || formsRunning}
                          >
                            {formsRunning ? "Syncing…" : "Run Sync"}
                          </button>
                        </div>
                      </div>

                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-title" style={{ marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ margin: 0 }}>Connector Catalog</h3>
                          <Badge tone="neutral">Coming Soon</Badge>
                        </div>
                        <p style={{ margin: 0 }}>Planned integrations for future connectors.</p>
                      </div>
                    </div>
                    <div className="connector-grid">
                      {[
                        [Cloud,     "Google Drive", "Ingestion from shared drives and team folders"],
                        [Building2, "SharePoint",   "Document libraries and team sites"],
                        [Database,  "BigQuery",     "Warehouse-backed activity records"],
                        [ListChecks,"Jira",         "Work tracking, issue, and sprint data"],
                        [Activity,  "Slack",        "Message and workflow activity signals"],
                        [Network,   "MCP Servers",  "Model Context Protocol server integrations"],
                      ].map(([Icon, title, copy]) => {
                        const ConnectorIcon = Icon as LucideIcon;
                        return (
                          <div className="connector-card disabled" key={String(title)} aria-disabled="true">
                            <ConnectorIcon size={20} />
                            <div className="connector-card-head"><strong>{title as string}</strong></div>
                            <span>{copy as string}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Persona config */}
                  <section className="panel">
                    <PanelTitle title="Active Persona Configuration" copy="All classification behaviour is expressed as configuration — no engine code changes required." Icon={BrainCircuit} />
                    <div className="persona-config-grid">
                      <div className="pc-row"><span>Persona</span><strong>{appConfig.personaName}</strong></div>
                      <div className="pc-row"><span>Rule version</span><strong>{appConfig.ruleVersion}</strong></div>
                      <div className="pc-row"><span>Decision authority</span><strong>{appConfig.decisionAuthorityLabel}</strong></div>
                      <div className="pc-row"><span>Semantic store</span><strong>{appConfig.semanticStoreLabel}</strong></div>
                      <div className="pc-row"><span>Review gate</span><strong>{appConfig.reviewThreshold}% confidence</strong></div>
                      <div className="pc-row"><span>Active connectors</span><strong>Excel · DOCX form</strong></div>
                      <div className="pc-row">
                        <span>Output mode</span>
                        <div className="mode-toggle">
                          <span className="mode-active">Annual</span>
                          <span className="mode-soon">Weekly <Badge tone="neutral">v2</Badge></span>
                        </div>
                      </div>
                      <div className="pc-row">
                        <span>Persona coverage</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="coverage-bar"><div className="coverage-fill" style={{ width: "80%" }} /></div>
                          <strong>≥ 80% FTE coverage</strong>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Product roadmap */}
                  <section className="panel">
                    <PanelTitle title="Product Roadmap" copy="Planned capabilities grounded in the production architecture. Each feature maps to a requirement or architectural principle." Icon={Route} />
                    <div className="roadmap-grid">
                      {([
                        { Icon: Users,        label: "HR & Identity Connector",    copy: "Workday / SAP SuccessFactors profile enrichment. Adds job title, org, cost centre context.",           ver: "v2" },
                        { Icon: Database,     label: "Investment Case Context",     copy: "Funding category and CapEx/OpEx designation per investment case injected at classification time.",      ver: "v2" },
                        { Icon: ShieldCheck,  label: "Accounting Rules Versioning", copy: "Upload and version fixed-asset rule documents. Rule version stamped on every output.",                  ver: "v2" },
                        { Icon: RefreshCw,    label: "Weekly Classification Mode",  copy: "Switch output mode from Annual to Weekly without engine code changes.",                                  ver: "v2" },
                        { Icon: Activity,     label: "Signal Explorer",             copy: "Drill into email, calendar, Jira, and system activity signals per employee per day.",                   ver: "v3" },
                        { Icon: BrainCircuit, label: "Multi-Persona Manager",       copy: "Add a new employee persona with a config file — no deployment required.",                               ver: "v3" },
                        { Icon: Building2,    label: "Contractor & Vendor Scope",   copy: "Extend classification to vendors and contractors. v1 covers FTE population only.",                      ver: "v3" },
                        { Icon: BarChart3,    label: "Real-time Processing Mode",   copy: "Stream classifications as signals arrive. Architecture already separates batch and stream paths.",       ver: "v4" },
                      ] as const).map(({ Icon: RIcon, label, copy, ver }) => (
                        <div className="roadmap-tile" key={label}>
                          <div className="roadmap-tile-head">
                            <div className="roadmap-icon"><RIcon size={16} /></div>
                            <Badge tone="neutral">{ver}</Badge>
                          </div>
                          <strong>{label}</strong>
                          <p>{copy}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {sourcesSubTab === "pipeline" && (
                <section className="panel">
                  <PanelTitle title="Shared Enrichment Path" copy="Both Excel and DOCX data follow the same normalisation path before the engine sees records." Icon={GitBranch} />
                  <div className="pipeline-strip">
                    {["Source intake", "Schema validation", "Field normalization", "Context injection", "Semantic retrieval", "Rules overlay", "Classification", "Confidence routing", "Audit write", "Feedback capture"].map((step) => (
                      <div className="pipe-node" key={step}>
                        <CheckCircle2 size={16} />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {sourcesSubTab === "validation" && (
                <section className="panel">
                  <PanelTitle title="Form Extraction Validation" copy="Parser output keyed against the workbook mapping sheet." Icon={SearchCheck} />
                  {validations.length ? (
                    <div className="page-stack">
                      <div className="manifest-grid">
                        <Manifest label="Forms parsed" value={validations.length} />
                        <Manifest label="Matched dataset" value={`${validations.filter((v) => v.matchedExcel).length}/${validations.length}`} />
                        <Manifest label="Avg extraction" value={`${validations.length ? Math.round(validations.reduce((s, v) => s + v.extractedFields / Math.max(1, v.totalFields) * 100, 0) / validations.length) : 0}%`} />
                        <Manifest label="Mapping rows" value={validationSourceRows.length} />
                      </div>
                      <div className="comparison-toolbar">
                        <div>
                          <strong>Compare one form to its Excel row</strong>
                          <p>Each field should line up to the same canonical schema.</p>
                        </div>
                        <select className="select" value={selectedFormComparison?.key ?? ""} onChange={(event) => setSelectedFormKey(event.target.value)}>
                          {validations.map((item) => (
                            <option key={item.key} value={item.key}>{item.fileName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="compact-table">
                        {validations.map((item) => (
                          <div className="compact-row" key={item.fileName}>
                            <div><strong>{item.fileName}</strong><span>{item.key}</span></div>
                            <Badge tone={item.matchedExcel ? "good" : "warn"}>{item.matchedExcel ? "Matched" : "Pending"}</Badge>
                            <strong>{item.confidence}%</strong>
                          </div>
                        ))}
                      </div>
                      {selectedFormComparison && (
                        <div className="comparison-panel">
                          <div className="comparison-summary">
                            <Manifest label="Fields extracted" value={`${validations.find((item) => item.key === selectedFormComparison.key)?.extractedFields ?? 0}/${validations.find((item) => item.key === selectedFormComparison.key)?.totalFields ?? formFieldMap.length}`} />
                            <Manifest label="Excel value agreement" value={`${selectedFormComparison.matchedCount}/${selectedFormComparison.totalCount}`} />
                            <Manifest label="Form confidence" value={validations.find((item) => item.key === selectedFormComparison.key)?.confidence ?? "N/A"} />
                            <Manifest label="Excel row found" value={selectedFormComparison.mappingRecord ? "Yes" : "No"} />
                            <Manifest label="Form file" value={validations.find((item) => item.key === selectedFormComparison.key)?.fileName ?? "Selected form"} />
                          </div>
                          <div className="table-wrap comparison-table-wrap">
                            <table className="comparison-table">
                              <thead>
                                <tr><th>Field</th><th>Form Value</th><th>Excel Value</th><th>Match</th></tr>
                              </thead>
                              <tbody>
                                {selectedFormComparison.rows.map((row) => (
                                  <tr key={row.field}>
                                    <td>{row.field}</td>
                                    <td>{formatFieldValue(row.formValue)}</td>
                                    <td>{formatFieldValue(row.excelValue)}</td>
                                    <td><Badge tone={row.match ? "good" : "warn"}>{row.match ? "Match" : "Diff"}</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyState copy="Upload the sample forms ZIP to show extracted field confidence and Excel-row validation." />
                  )}
                </section>
              )}
            </div>
          )}

          {activeTab === "records" && (
            <RecordsView
              records={filteredRecords}
              filter={filter}
              setFilter={setFilter}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              overrideRecord={overrideRecord}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "review" && (
            <ReviewView records={reviewRecords} setSelectedId={setSelectedId} overrideRecord={overrideRecord} setActiveTab={setActiveTab} />
          )}

          {activeTab === "audit" && (
            <AuditView records={records} initialExpandId={selectedId} />
          )}

          {activeTab === "learning" && (
            <LearningView records={records} feedbackEvents={feedbackEvents} />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView records={records} metrics={metrics} validationRate={validationRate} />
          )}

        </div>
      </section>
    </main>
  );
}

function PageHeader({ title, copy, Icon }: { title: string; copy: string; Icon: LucideIcon }) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="page-icon"><Icon size={22} /></div>
    </div>
  );
}

function PanelTitle({ title, copy, Icon }: { title: string; copy: string; Icon: LucideIcon }) {
  return (
    <div className="panel-title">
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
      <Icon size={20} />
    </div>
  );
}

function Manifest({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="manifest">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return <div className="empty-state">{copy}</div>;
}

function classTone(value: Classification): "good" | "warn" | "danger" | "blue" {
  if (value === "CapEx") return "good";
  if (value === "OpEx") return "blue";
  return "warn";
}

function RecordDetail({ record }: { record: ClassifiedRecord }) {
  const sections: { title: string; fields: [string, unknown][] }[] = [
    { title: "Identity & Initiative", fields: [
      ["Initiative ID", record.InitiativeID], ["Initiative Name", record.InitiativeName],
      ["Division Code", record.DivisionCode], ["Technology Generation", record.TechnologyGeneration],
    ]},
    { title: "Time Period", fields: [
      ["Fiscal Year", record.FiscalYear], ["Fiscal Month", record.FiscalMonth],
      ["Fiscal Quarter", record.FiscalQuarter], ["Project Start Date", record.ProjectStartDate],
      ["Project End Date", record.ProjectEndDate],
    ]},
    { title: "Geography", fields: [
      ["Site City", record.SiteCity], ["Site State", record.SiteState],
      ["ZIP Code", record.SiteZipCode], ["Site Switch Code", record.SiteSwitchCode],
      ["Regional Switch Code", record.RegionalSwitchCode], ["Regional Market", record.RegionalMarket],
      ["Regional State", record.RegionalState], ["Operations Cluster", record.OperationsCluster],
    ]},
    { title: "Spend & Cost Classification", fields: [
      ["Spend Type", record.SpendType], ["VZZ Cost Class", record.VZZ_CostClass],
      ["VZZ Work Type", record.VZZ_WorkType], ["Labor Survey Category", record.LaborSurvey_Category],
      ["CapEx Eligible %", record.CapEx_Eligible_Pct != null ? `${record.CapEx_Eligible_Pct}%` : null],
    ]},
    { title: "Financials", fields: [
      ["Budget Amount", record.BudgetAmount_USD != null ? currency(toNumber(record.BudgetAmount_USD)) : null],
      ["Actual Spend", record.ActualSpend_USD != null ? currency(toNumber(record.ActualSpend_USD)) : null],
      ["Forecast Spend", record.ForecastSpend_USD != null ? currency(toNumber(record.ForecastSpend_USD)) : null],
      ["Cumulative Spend", record.CumulativeSpend_USD != null ? currency(toNumber(record.CumulativeSpend_USD)) : null],
    ]},
    { title: "Labor Activity", fields: [
      ["Engineer ID", record.Engineer_ID], ["Team", record.Team],
      ["Hours Logged", record.Hours_Logged], ["Activity Type", record.Activity_Type],
      ["Source System", record.Source_System],
    ]},
    { title: "Field Activity", fields: [
      ["Miles Driven", record.Miles_Driven], ["Drive Tests Completed", record.DriveTests_Completed],
      ["Pre/Post Flag", record.Pre_Post_Flag], ["Milestones Completed", record.Milestones_Completed],
      ["Passing Units", record.PassingUnits], ["Asset Life (Years)", record.Asset_Life_Years],
      ["Annual Depreciation", record.Depreciation_Annual_USD != null ? currency(toNumber(record.Depreciation_Annual_USD)) : null],
    ]},
    { title: "Project Status", fields: [
      ["Project Status", record.Project_Status],
    ]},
    { title: "Classification Result", fields: [
      ["Classification", record._override ?? record._classification],
      ["Confidence", record._confidence],
      ["Rule Version", record._ruleVersion],
      ["Persona", record._persona],
      ["Source", record._source],
      ["Review Reason", record._reviewReason],
      ["Evidence", record._evidence],
      ["Override", record._override ?? "None"],
    ]},
  ];

  return (
    <div className="record-detail">
      {sections.map((section) => (
        <div key={section.title} className="detail-section">
          <div className="detail-section-title">{section.title}</div>
          <div className="detail-grid">
            {section.fields.map(([label, value]) => (
              <div key={label} className="detail-field">
                <span className="detail-label">{label}</span>
                <span className="detail-value">{value != null && value !== "" && value !== 0 ? String(value) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordsView({
  records,
  filter,
  setFilter,
  selectedId,
  setSelectedId,
  overrideRecord,
  setActiveTab
}: {
  records: ClassifiedRecord[];
  filter: Classification | "All";
  setFilter: (value: Classification | "All") => void;
  selectedId: string;
  setSelectedId: (value: string) => void;
  overrideRecord: (id: string, value: Classification | "") => void;
  setActiveTab: (value: TabId) => void;
}) {
  const [expandedId, setExpandedId] = useState<string>("");

  function toggleExpand(id: string) {
    setExpandedId((prev) => prev === id ? "" : id);
    setSelectedId(id);
  }

  return (
    <div className="page-stack">
      <PageHeader title="Activity Records" copy="Click any row to expand all 39 fields. Normalized classification queue with evidence, confidence, and correction controls." Icon={TableProperties} />
      <section className="panel">
        <div className="toolbar">
          <div className="segmented">
            {(["All", "CapEx", "OpEx", "Review"] as const).map((item) => (
              <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)} type="button">{item}</button>
            ))}
          </div>
          <Badge tone="blue">{records.length} visible records</Badge>
        </div>
        {records.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 24 }} />
                  <th>Record</th>
                  <th>Engineer</th>
                  <th>Activity</th>
                  <th>Survey Category</th>
                  <th>Spend</th>
                  <th>Class</th>
                  <th>Quality</th>
                  <th>Confidence</th>
                  <th>Override</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 120).map((record) => {
                  const finalClass = record._override ?? record._classification;
                  const isExpanded = expandedId === record._id;
                  return (
                    <>
                      <tr className={selectedId === record._id ? "selected-row" : ""} key={record._id} style={{ cursor: "pointer" }} onClick={() => toggleExpand(record._id)}>
                        <td style={{ textAlign: "center", color: "var(--muted)", fontSize: 11, userSelect: "none" }}>{isExpanded ? "▼" : "▶"}</td>
                        <td>
                          <span className="link-button">{record._key}</span>
                          <span className="microcopy">{record._source} · {cleanText(record.SiteCity) || "No site"}</span>
                        </td>
                        <td>{cleanText(record.Engineer_ID) || "Simulated"}</td>
                        <td>{cleanText(record.Activity_Type) || "Unspecified activity"}</td>
                        <td>{cleanText(record.LaborSurvey_Category) || "Unmapped"}</td>
                        <td>{currency(toNumber(record.ActualSpend_USD))}</td>
                        <td><Badge tone={classTone(finalClass)}>{finalClass}</Badge></td>
                        <td>
                          {record._processingStatus === "quarantined" || record._rowQuality?.status === "quarantined" ? (
                            <Badge tone="danger">Quarantined</Badge>
                          ) : record._rowQuality?.status === "repairable" ? (
                            <Badge tone="warn">Repairable</Badge>
                          ) : (
                            <Badge tone="good">Clean</Badge>
                          )}
                        </td>
                        <td><Confidence value={record._confidence} /></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select className="select" value={record._override ?? ""} onChange={(event) => overrideRecord(record._id, event.target.value as Classification | "")}>
                            <option value="">None</option>
                            <option value="CapEx">CapEx</option>
                            <option value="OpEx">OpEx</option>
                            <option value="Review">Review</option>
                          </select>
                        </td>
                        <td className="evidence">{record._evidence}</td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${record._id}-detail`} className="detail-row">
                          <td colSpan={11} style={{ padding: 0, background: "#f8fafc" }}>
                            <RecordDetail record={record} />
                            <div style={{ padding: "8px 24px 12px", borderTop: "1px solid var(--border)" }}>
                              <button
                                type="button"
                                style={{ border: "1px solid var(--border)", borderRadius: 7, background: "white", color: "var(--primary)", padding: "6px 12px", fontSize: 12, fontWeight: 700 }}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(record._id); setActiveTab("audit"); }}
                              >
                                Inspect Audit Trail →
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState copy="Upload the Excel workbook or form ZIP from Data Sources to populate the activity queue." />
        )}
      </section>
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  const tone = value >= 80 ? "good" : value >= REVIEW_THRESHOLD ? "warn" : "danger";
  return <span className={`confidence ${tone}`}>{value}</span>;
}

function ReviewView({
  records,
  setSelectedId,
  overrideRecord,
  setActiveTab
}: {
  records: ClassifiedRecord[];
  setSelectedId: (value: string) => void;
  overrideRecord: (id: string, value: Classification | "") => void;
  setActiveTab: (value: TabId) => void;
}) {
  const [expandedId, setExpandedId] = useState<string>("");

  return (
    <div className="page-stack">
      <PageHeader title="Domain Lead Review Queue" copy="Low-confidence classifications are routed here instead of going directly to employees." Icon={Route} />
      <section className="panel">
        {records.length ? (
          <div className="review-list">
            {records.map((record) => {
              const isExpanded = expandedId === record._id;
              return (
                <div
                  className={`review-card${isExpanded ? " is-expanded" : ""}`}
                  key={record._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? "" : record._id)}
                >
                  <div style={{ width: "100%" }}>
                    <div className="review-title">
                      <strong>{record._key}</strong>
                      <Badge tone="warn">{record._confidence} confidence</Badge>
                      <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{isExpanded ? "▼" : "▶"}</span>
                    </div>
                    <p>{record._reviewReason}</p>
                    <span>{cleanText(record.Activity_Type)} · {cleanText(record.Engineer_ID) || "Simulated engineer"}</span>
                  </div>
                  <div className="review-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => overrideRecord(record._id, "CapEx")}>Approve CapEx</button>
                    <button type="button" onClick={() => overrideRecord(record._id, "OpEx")}>Approve OpEx</button>
                    <button type="button" onClick={() => { setSelectedId(record._id); setActiveTab("audit"); }}>Inspect Trace</button>
                  </div>
                  {isExpanded && (
                    <div className="review-card-detail" onClick={(e) => e.stopPropagation()}>
                      <RecordDetail record={record} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState copy="No records are currently below the confidence threshold. Upload data or inspect overrides to test this workflow." />
        )}
      </section>
    </div>
  );
}

function AgentStepTimeline({ trace }: { trace: NonNullable<ClassifiedRecord["_agentTrace"]> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {trace.steps.map((step, i) => {
        const isLast = i === trace.steps.length - 1;
        const statusColor =
          step.status === "completed" ? "#12b76a" :
          step.status === "fallback" ? "#f79009" :
          step.status === "failed" ? "#f04438" : "#6b7280";
        return (
          <div key={i} style={{ display: "flex", gap: 12, paddingBottom: isLast ? 0 : 14 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor, marginTop: 3, flexShrink: 0 }} />
              {!isLast && <div style={{ width: 2, flex: 1, background: "#e5e7eb", marginTop: 2 }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{step.agent}</span>
                <span style={{ fontSize: 10, color: statusColor, fontWeight: 600, textTransform: "uppercase" as const }}>{step.status}</span>
                {step.provider && step.provider !== "deterministic" && step.provider !== "error" && (
                  <span style={{ fontSize: 10, color: "var(--muted)", background: "#f3f4f6", borderRadius: 4, padding: "1px 6px" }}>{step.provider}</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{step.summary}</p>
              {Object.keys(step.output).length > 0 && (
                <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {Object.entries(step.output).slice(0, 4).map(([k, v]) => (
                    <span key={k} style={{ fontSize: 10, background: "#f8f9fb", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 7px", color: "var(--text)" }}>
                      {k}: {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AuditTrailDetail({ record }: { record: ClassifiedRecord }) {
  const finalClass = record._override ?? record._classification;
  const precedents = semanticPrecedents(record);
  const trace = record._agentTrace;
  const traceCopy = trace
    ? `Provider: ${trace.provider}${trace.model ? ` · ${trace.model}` : ""} · ${trace.steps.length} agents`
    : "Backend offline — re-upload to see the 6-agent pipeline trace.";

  return (
    <div style={{ background: "#fff", borderTop: "3px solid var(--primary)", borderBottom: "1px solid var(--border)", padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        <div className="panel" style={{ margin: 0 }}>
          <PanelTitle title="Classification Trace" copy="Immutable production events would be appended, never overwritten." Icon={Archive} />
          <div className="audit-grid">
            <Manifest label="Record key" value={record._key} />
            <Manifest label="Source" value={record._source} />
            <Manifest label="Rule version" value={record._ruleVersion} />
            <Manifest label="Initial output" value={record._classification} />
            <Manifest label="Final output" value={finalClass ?? "N/A"} />
            <Manifest label="Confidence" value={record._confidence} />
          </div>
          <div className="audit-note">
            <strong>Evidence</strong>
            <p>{record._evidence}</p>
          </div>
        </div>
        <div className="panel" style={{ margin: 0 }}>
          <PanelTitle title="Signal Ledger" copy="Signals retained with direction and impact for accounting defense." Icon={SearchCheck} />
          <div className="signal-list">
            {record._signals.length ? record._signals.map((signal) => (
              <div className="signal" key={signal.label}>
                <span>{signal.label}</span>
                <strong>{signal.impact > 0 ? "+" : ""}{signal.impact}</strong>
              </div>
            )) : <EmptyState copy="No detailed signals were available for this record." />}
          </div>
        </div>
        <div className="panel" style={{ margin: 0 }}>
          <PanelTitle title="Semantic Precedents" copy={`Production uses ${appConfig.semanticStoreLabel} to retrieve similar reviewed records.`} Icon={Database} />
          <div className="precedent-list">
            {precedents.map((precedent) => (
              <div className="precedent" key={precedent.id}>
                <div>
                  <strong>{precedent.title}</strong>
                  <span>{precedent.note}</span>
                </div>
                <Badge tone={precedent.label === "CapEx" ? "good" : "blue"}>{precedent.label} · {precedent.similarity}%</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel" style={{ margin: 0 }}>
        <PanelTitle title="Agent Pipeline Trace" copy={traceCopy} Icon={Bot} />
        {trace ? (
          <>
            <AgentStepTimeline trace={trace} />
            {record._confidenceAdjusted !== undefined && record._confidenceAdjusted !== record._confidence && (
              <div style={{ marginTop: 10, padding: "6px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, fontSize: 11, color: "#92400e" }}>
                LLM confidence adjustment applied: {record._confidence} → {record._confidenceAdjusted} (routing uses original {record._confidence})
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: "10px 0", color: "var(--muted)", fontSize: 12 }}>
            No agent trace available. This record was classified locally while the backend was offline. Re-upload with the backend running to see the full 6-agent pipeline trace.
          </div>
        )}
      </div>
    </div>
  );
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAuditCsv(records: ClassifiedRecord[]) {
  const cols = [
    "RecordKey", "Source", "SourceFile", "ActivityType", "LaborSurveyCategory",
    "ActualSpend_USD", "Classification", "Override", "FinalClassification",
    "Confidence", "RuleVersion", "Persona", "Evidence", "ReviewReason",
    "Signals", "MatchedExcel", "RecordUID"
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const rows = records.map((r) => [
    r._key, r._source, r._sourceFileName, cleanText(r.Activity_Type),
    cleanText(r.LaborSurvey_Category), r.ActualSpend_USD ?? "",
    r._classification, r._override ?? "", r._override ?? r._classification,
    r._confidence, r._ruleVersion, r._persona, r._evidence, r._reviewReason,
    r._signals.map((s) => `${s.label}:${s.impact}`).join(" | "),
    r._matchedExcel ? "Yes" : "No", r._recordUid ?? r._id
  ].map(escape).join(","));
  const ts = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
  downloadBlob([cols.join(","), ...rows].join("\n"), `audit_report_${ts}.csv`, "text/csv");
}

function exportAuditJson(records: ClassifiedRecord[]) {
  const payload = records.map((r) => ({
    recordKey: r._key,
    source: r._source,
    sourceFile: r._sourceFileName,
    activityType: cleanText(r.Activity_Type),
    laborSurveyCategory: cleanText(r.LaborSurvey_Category),
    actualSpend: r.ActualSpend_USD,
    classification: r._classification,
    override: r._override ?? null,
    finalClassification: r._override ?? r._classification,
    confidence: r._confidence,
    ruleVersion: r._ruleVersion,
    persona: r._persona,
    evidence: r._evidence,
    reviewReason: r._reviewReason,
    signals: r._signals,
    matchedExcel: !!r._matchedExcel,
    recordUid: r._recordUid ?? r._id,
  }));
  const ts = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
  downloadBlob(JSON.stringify(payload, null, 2), `audit_report_${ts}.json`, "application/json");
}

function AuditView({ records, initialExpandId }: { records: ClassifiedRecord[]; initialExpandId?: string }) {
  const [expandedId, setExpandedId] = useState<string>(initialExpandId ?? "");
  const expandedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (initialExpandId) setExpandedId(initialExpandId);
  }, [initialExpandId]);

  useEffect(() => {
    if (!expandedId || !expandedRowRef.current) return;
    const timer = setTimeout(() => {
      expandedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    return () => clearTimeout(timer);
  }, [expandedId]);

  return (
    <div className="page-stack">
      <PageHeader title="Audit Trail" copy="Click any record to expand its classification trace, signal ledger, and semantic precedents." Icon={ListChecks} />
      <section className="panel">
        {records.length ? (
          <>
            <div className="toolbar" style={{ marginBottom: 12 }}>
              <Badge tone="blue">{records.length} records</Badge>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                <button
                  type="button"
                  onClick={() => exportAuditCsv(records)}
                  style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border)", borderRadius: 7, background: "white", color: "var(--text)", padding: "6px 12px", fontSize: 12, fontWeight: 600 }}
                >
                  ↓ Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportAuditJson(records)}
                  style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border)", borderRadius: 7, background: "white", color: "var(--text)", padding: "6px 12px", fontSize: 12, fontWeight: 600 }}
                >
                  ↓ Export JSON
                </button>
              </div>
            </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 24 }} />
                  <th>Record</th>
                  <th>Activity</th>
                  <th>Category</th>
                  <th>Spend</th>
                  <th>Class</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const finalClass = record._override ?? record._classification;
                  const isExpanded = expandedId === record._id;
                  return (
                    <>
                      <tr key={record._id} ref={isExpanded ? expandedRowRef : undefined} style={{ cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? "" : record._id)}>
                        <td style={{ textAlign: "center", color: "var(--muted)", fontSize: 11, userSelect: "none" }}>{isExpanded ? "▼" : "▶"}</td>
                        <td>
                          <span className="link-button">{record._key}</span>
                          <span className="microcopy">{record._source}</span>
                        </td>
                        <td>{cleanText(record.Activity_Type) || "—"}</td>
                        <td>{cleanText(record.LaborSurvey_Category) || "—"}</td>
                        <td>{currency(toNumber(record.ActualSpend_USD))}</td>
                        <td><Badge tone={classTone(finalClass)}>{finalClass}</Badge></td>
                        <td><Confidence value={record._confidence} /></td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${record._id}-audit`}>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <AuditTrailDetail record={record} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <EmptyState copy="Upload data from Data Sources to populate the audit trail." />
        )}
      </section>
    </div>
  );
}

function semanticPrecedents(record: ClassifiedRecord): Array<{ id: string; title: string; label: "CapEx" | "OpEx"; similarity: number; note: string }> {
  const activity = cleanText(record.Activity_Type) || "activity";
  const capexLike = (record._override ?? record._classification) === "CapEx";
  return [
    {
      id: "precedent-1",
      title: `Reviewed precedent: ${activity.slice(0, 42)}`,
      label: capexLike ? "CapEx" : "OpEx",
      similarity: Math.min(96, Math.max(78, record._confidence + 5)),
      note: capexLike
        ? "Prior reviewed record matched build/deploy/asset-creation language and was confirmed capitalizable."
        : "Prior reviewed record matched support/admin/maintenance language and was confirmed expense."
    },
    {
      id: "precedent-2",
      title: "Policy excerpt match",
      label: capexLike ? "CapEx" : "OpEx",
      similarity: Math.min(91, Math.max(72, record._confidence - 2)),
      note: "Semantic retrieval supports the evidence package; deterministic policy rules still make the final call."
    }
  ];
}

function LearningView({
  records,
  feedbackEvents
}: {
  records: ClassifiedRecord[];
  feedbackEvents: ClassifiedRecord[];
}) {
  const conflictRate = records.length ? Math.round((feedbackEvents.length / records.length) * 100) : 0;
  const capexOverrides = feedbackEvents.filter((r) => r._override === "CapEx").length;
  const opexOverrides = feedbackEvents.filter((r) => r._override === "OpEx").length;
  const reviewOverrides = feedbackEvents.filter((r) => r._override === "Review").length;
  return (
    <div className="page-stack">
      <PageHeader
        title="Feedback Learning"
        copy="Reviewer corrections are captured and logged as labeled data. Conflict rate is tracked per run."
        Icon={RefreshCw}
      />
      <section className="metric-grid">
        <MetricCard label="Conflict Rate" value={`${conflictRate}%`} hint={`${feedbackEvents.length} correction${feedbackEvents.length === 1 ? "" : "s"} out of ${records.length} classifications`} Icon={AlertTriangle} tone={feedbackEvents.length > 0 ? "red" : undefined} />
        <MetricCard label="Total Corrections" value={feedbackEvents.length} hint="Overrides captured this session" Icon={RefreshCw} tone="amber" />
        <MetricCard label="CapEx Corrections" value={capexOverrides} hint="Reclassified as capitalizable" Icon={CheckCircle2} tone="green" />
        <MetricCard label="OpEx Corrections" value={opexOverrides} hint="Reclassified as operating expense" Icon={Archive} />
        {reviewOverrides > 0 && <MetricCard label="Sent to Review" value={reviewOverrides} hint="Escalated by reviewer" Icon={AlertTriangle} tone="amber" />}
      </section>
      <section className="panel">
        <PanelTitle title="Correction Log" copy="Every override is captured with original classification, reviewer decision, and rule version." Icon={Database} />
        {feedbackEvents.length ? (
          <div className="compact-table">
            {feedbackEvents.map((record) => (
              <div className="compact-row" key={record._id}>
                <div>
                  <strong>{record._key}</strong>
                  <span>{record._classification} → {record._override}{record._overrideNote ? ` · "${record._overrideNote}"` : ""} · {record._ruleVersion}</span>
                </div>
                <Badge tone={record._override === "CapEx" ? "good" : record._override === "OpEx" ? "blue" : "warn"}>{record._override}</Badge>
                <strong>{record._confidence}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState copy="No corrections yet. Override records in Activity Records or Review Queue to log feedback events." />
        )}
      </section>
    </div>
  );
}

function normQ(val: unknown): string {
  const s = cleanText(String(val ?? "")).toUpperCase().trim();
  if (/^Q[1-4]$/.test(s)) return s;
  if (/^[1-4]$/.test(s)) return `Q${s}`;
  return "";
}

const AC = { capex: "#16a34a", opex: "#2563eb", review: "#d97706", grid: "#f0f2f5", axis: "#9ca3af", lbl: "#6b7280" };

function GroupedBarChart({ data, series, height = 220 }: {
  data: { label: string; values: number[] }[];
  series: { label: string; color: string }[];
  height?: number;
}) {
  const W = 520, H = height;
  const pad = { t: 24, r: 20, b: 40, l: 40 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;
  const maxVal = Math.max(...data.flatMap(d => d.values), 1);
  const groupW = chartW / data.length;
  const gap = 3;
  const barW = Math.max(10, (groupW - (series.length + 1) * gap) / series.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = pad.t + chartH * (1 - f);
        return <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke={AC.grid} strokeWidth={1} />
          <text x={pad.l - 5} y={y + 4} textAnchor="end" fontSize={9} fill={AC.axis}>{Math.round(maxVal * f)}</text>
        </g>;
      })}
      {data.map((group, gi) => {
        const gx = pad.l + gi * groupW + gap;
        return <g key={group.label}>
          {series.map((s, si) => {
            const val = group.values[si];
            const bH = Math.max((val / maxVal) * chartH, val > 0 ? 2 : 0);
            const x = gx + si * (barW + gap);
            const y = pad.t + chartH - bH;
            return <g key={s.label}>
              <rect x={x} y={y} width={barW} height={bH} fill={s.color} rx={3} opacity={0.88}>
                <title>{group.label} · {s.label}: {val}</title>
              </rect>
              {bH > 18 && <text x={x + barW / 2} y={y + 11} textAnchor="middle" fontSize={8} fill="white" fontWeight="600">{val}</text>}
            </g>;
          })}
          <text x={pad.l + gi * groupW + groupW / 2} y={H - 10} textAnchor="middle" fontSize={11} fill={AC.lbl} fontWeight="600">{group.label}</text>
        </g>;
      })}
      <line x1={pad.l} x2={W - pad.r} y1={pad.t + chartH} y2={pad.t + chartH} stroke={AC.grid} strokeWidth={1.5} />
    </svg>
  );
}

function AreaLineChart({ data, color = "#16a34a", unit = "%", height = 160 }: {
  data: { label: string; value: number }[];
  color?: string; unit?: string; height?: number;
}) {
  if (data.length < 2) return <EmptyState copy="Not enough data points for trend." />;
  const W = 520, H = height;
  const pad = { t: 20, r: 20, b: 28, l: 40 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;
  const vals = data.map(d => d.value);
  const minV = Math.max(0, Math.min(...vals) - 8);
  const maxV = Math.min(100, Math.max(...vals) + 8);
  const rng = maxV - minV || 1;
  const toX = (i: number) => pad.l + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => pad.t + chartH * (1 - (v - minV) / rng);
  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${pad.t + chartH} L${pts[0].x},${pad.t + chartH} Z`;
  const gid = `ag${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(f => {
        const v = minV + f * rng;
        const y = toY(v);
        return <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke={AC.grid} strokeWidth={1} />
          <text x={pad.l - 5} y={y + 4} textAnchor="end" fontSize={9} fill={AC.axis}>{Math.round(v)}{unit}</text>
        </g>;
      })}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="white" stroke={color} strokeWidth={2}>
          <title>{data[i].label}: {data[i].value}{unit}</title>
        </circle>
      ))}
      {data.map((d, i) => (data.length <= 7 || i % 2 === 0) && (
        <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill={AC.axis}>{d.label}</text>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={pad.t + chartH} y2={pad.t + chartH} stroke={AC.grid} strokeWidth={1.5} />
    </svg>
  );
}

function LollipopChart({ data, color = "#2563eb" }: { data: { label: string; value: number; sub?: string }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map(({ label, value, sub }) => {
        const w = (value / max) * 100;
        return (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr 52px", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}</span>
              <div style={{ position: "relative", height: 4, background: "#f0f2f5", borderRadius: 4 }}>
                <div style={{ position: "absolute", inset: 0, width: `${w}%`, background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
                <div style={{ position: "absolute", top: "50%", left: `${w}%`, transform: "translate(-50%,-50%)", width: 12, height: 12, borderRadius: "50%", background: "white", border: `2.5px solid ${color}`, transition: "left 0.5s ease" }} />
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "right" }}>{sub ?? value}</span>
          </div>
        );
      })}
    </div>
  );
}

function VerticalHistogram({ bands, total }: { bands: { label: string; sublabel: string; count: number; color: string }[]; total: number }) {
  const max = Math.max(...bands.map(b => b.count), 1);
  const barH = 120;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: barH + 4, paddingBottom: 4 }}>
        {bands.map(({ label, count, color }) => {
          const h = Math.max(4, (count / max) * barH);
          const pctVal = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{pctVal}%</span>
              <div style={{ width: "100%", height: h, background: color, borderRadius: "5px 5px 0 0", transition: "height 0.5s ease" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${bands.length}, 1fr)`, borderTop: `2px solid ${AC.grid}`, paddingTop: 8 }}>
        {bands.map(({ label, sublabel, count, color }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
            <span style={{ fontSize: 10, color: AC.lbl, textAlign: "center" }}>{sublabel}</span>
            <span style={{ fontSize: 10, color: AC.axis }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegionTiles({ data }: { data: { label: string; capex: number; opex: number; review: number; total: number }[] }) {
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
      {data.map(({ label, capex, total }) => {
        const capexPct = total ? Math.round((capex / total) * 100) : 0;
        const alpha = (40 + Math.round((total / maxTotal) * 55)).toString(16).padStart(2, "0");
        return (
          <div key={label} style={{ background: `#16a34a${alpha}`, border: "1px solid rgba(22,163,74,0.25)", borderRadius: 8, padding: "10px 12px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}</span>
            <div style={{ height: 5, borderRadius: 3, background: "#e5e7eb", overflow: "hidden", margin: "6px 0 4px" }}>
              <div style={{ width: `${capexPct}%`, height: "100%", background: AC.capex, borderRadius: 3 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: AC.lbl }}>
              <span style={{ color: AC.capex, fontWeight: 600 }}>{capexPct}% CapEx</span>
              <span>{total} records</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function AnalyticsView({
  records,
  metrics: _metrics,
  validationRate: _validationRate
}: {
  records: ClassifiedRecord[];
  metrics: { total: number; capex: number; opex: number; review: number; quarantined: number; hours: number; capexHours: number; capexDollars: number; avgConfidence: number; overrides: number; uniqueEngineers: number; };
  validationRate: number;
}) {
  const [fyFilter, setFyFilter] = useState("All");
  const [qFilter, setQFilter] = useState("All");
  const [divFilter, setDivFilter] = useState("All");

  const fiscalYears = useMemo(() =>
    ["All", ...Array.from(new Set(records.map(r => cleanText(r.FiscalYear)).filter(Boolean))).sort().reverse()],
    [records]);

  const divisions = useMemo(() =>
    ["All", ...Array.from(new Set(records.map(r => cleanText(r.DivisionCode)).filter(Boolean))).sort()],
    [records]);

  const filtered = useMemo(() => records.filter(r => {
    if (fyFilter !== "All" && cleanText(r.FiscalYear) !== fyFilter) return false;
    if (qFilter !== "All" && normQ(r.FiscalQuarter) !== qFilter) return false;
    if (divFilter !== "All" && cleanText(r.DivisionCode) !== divFilter) return false;
    return true;
  }), [records, fyFilter, qFilter, divFilter]);

  const quarterlyData = useMemo(() => {
    const map = new Map<string, { capex: number; opex: number; review: number; capexSpend: number; opexSpend: number }>();
    for (const q of ["Q1", "Q2", "Q3", "Q4"]) map.set(q, { capex: 0, opex: 0, review: 0, capexSpend: 0, opexSpend: 0 });
    for (const r of filtered) {
      const q = normQ(r.FiscalQuarter); if (!q) continue;
      const e = map.get(q)!;
      const cls = r._override ?? r._classification;
      const spend = Math.max(0, toNumber(r.ActualSpend_USD));
      if (cls === "CapEx") { e.capex++; e.capexSpend += spend; }
      else if (cls === "OpEx") { e.opex++; e.opexSpend += spend; }
      else e.review++;
    }
    return Array.from(map.entries()).map(([q, v]) => ({ q, ...v, total: v.capex + v.opex + v.review }));
  }, [filtered]);

  const monthlyTrend = useMemo(() => {
    const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const STUB = [48, 52, 45, 58, 61, 55, 49, 53, 57, 62, 59, 64];
    const map = new Map<number, { capex: number; total: number }>();
    for (const r of filtered) {
      const m = Math.trunc(toNumber(r.FiscalMonth));
      if (m < 1 || m > 12) continue;
      if (!map.has(m)) map.set(m, { capex: 0, total: 0 });
      const e = map.get(m)!; e.total++;
      if ((r._override ?? r._classification) === "CapEx") e.capex++;
    }
    if (map.size >= 3) {
      return Array.from(map.entries()).sort(([a], [b]) => a - b)
        .map(([m, v]) => ({ label: MO[m - 1], value: v.total ? Math.round((v.capex / v.total) * 100) : 0 }));
    }
    return MO.map((label, i) => ({ label, value: STUB[i] }));
  }, [filtered]);

  const categoryData = useMemo(() => {
    const map = new Map<string, { capex: number; opex: number; review: number }>();
    for (const r of filtered) {
      const cat = cleanText(r.LaborSurvey_Category) || "Uncategorized";
      if (!map.has(cat)) map.set(cat, { capex: 0, opex: 0, review: 0 });
      const e = map.get(cat)!;
      const cls = r._override ?? r._classification;
      if (cls === "CapEx") e.capex++; else if (cls === "OpEx") e.opex++; else e.review++;
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, ...v, total: v.capex + v.opex + v.review }))
      .sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filtered]);

  const divisionData = useMemo(() => {
    const map = new Map<string, { capex: number; opex: number; review: number }>();
    for (const r of filtered) {
      const div = cleanText(r.DivisionCode) || "Unknown";
      if (!map.has(div)) map.set(div, { capex: 0, opex: 0, review: 0 });
      const e = map.get(div)!;
      const cls = r._override ?? r._classification;
      if (cls === "CapEx") e.capex++; else if (cls === "OpEx") e.opex++; else e.review++;
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, ...v, total: v.capex + v.opex + v.review }))
      .sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filtered]);

  const confidenceBands = useMemo(() => {
    const bands = [
      { label: "80–100", sublabel: "High", min: 80, max: 100, color: "#16a34a", count: 0 },
      { label: "60–79",  sublabel: "Medium", min: 60, max: 79, color: "#2563eb", count: 0 },
      { label: "40–59",  sublabel: "Low", min: 40, max: 59, color: "#d97706", count: 0 },
      { label: "0–39",   sublabel: "Very Low", min: 0, max: 39, color: "#dc2626", count: 0 },
    ];
    for (const r of filtered)
      for (const b of bands) { if (r._confidence >= b.min && r._confidence <= b.max) { b.count++; break; } }
    return bands;
  }, [filtered]);

  const regionalData = useMemo(() => {
    const map = new Map<string, { capex: number; opex: number; review: number }>();
    for (const r of filtered) {
      const region = cleanText(r.RegionalMarket) || "Unknown";
      if (!map.has(region)) map.set(region, { capex: 0, opex: 0, review: 0 });
      const e = map.get(region)!;
      const cls = r._override ?? r._classification;
      if (cls === "CapEx") e.capex++; else if (cls === "OpEx") e.opex++; else e.review++;
    }
    return Array.from(map.entries())
      .map(([label, v]) => ({ label, ...v, total: v.capex + v.opex + v.review }))
      .sort((a, b) => b.total - a.total).slice(0, 12);
  }, [filtered]);

  const spendByClass = useMemo(() => {
    let capexSpend = 0, opexSpend = 0, reviewSpend = 0;
    for (const r of filtered) {
      const spend = Math.max(0, toNumber(r.ActualSpend_USD));
      const cls = r._override ?? r._classification;
      if (cls === "CapEx") capexSpend += spend;
      else if (cls === "OpEx") opexSpend += spend;
      else reviewSpend += spend;
    }
    return { capexSpend, opexSpend, reviewSpend, total: capexSpend + opexSpend + reviewSpend };
  }, [filtered]);

  const filteredCapex = filtered.filter(r => (r._override ?? r._classification) === "CapEx").length;
  const filteredOpex  = filtered.filter(r => (r._override ?? r._classification) === "OpEx").length;
  const filteredReview = filtered.filter(r => (r._override ?? r._classification) === "Review").length;
  const avgConf = filtered.length ? Math.round(filtered.reduce((s, r) => s + r._confidence, 0) / filtered.length) : 0;

  const seriesLegend = (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {([["#16a34a","CapEx"],["#2563eb","OpEx"],["#d97706","Review"]] as const).map(([color, label]) => (
        <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: AC.lbl }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: "inline-block" }} />{label}
        </span>
      ))}
    </div>
  );

  return (
    <div className="page-stack">
      <PageHeader title="Analytics" copy="Business intelligence across classification, spend, confidence, and geography." Icon={Activity} />

      <section className="panel" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>Filters</span>
          <select className="select" value={fyFilter} onChange={e => setFyFilter(e.target.value)} style={{ minWidth: 110 }}>
            {fiscalYears.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : `FY ${y}`}</option>)}
          </select>
          <div className="segmented" style={{ margin: 0 }}>
            {["All","Q1","Q2","Q3","Q4"].map(q => (
              <button key={q} type="button" className={qFilter === q ? "active" : ""} onClick={() => setQFilter(q)}>{q}</button>
            ))}
          </div>
          <select className="select" value={divFilter} onChange={e => setDivFilter(e.target.value)} style={{ minWidth: 130 }}>
            {divisions.map(d => <option key={d} value={d}>{d === "All" ? "All Divisions" : d}</option>)}
          </select>
          <span style={{ marginLeft: "auto" }}><Badge tone="blue">{filtered.length} records</Badge></span>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard label="CapEx Records" value={filteredCapex} hint={spendByClass.total ? `${pct((spendByClass.capexSpend / spendByClass.total) * 100)} of spend` : "No spend data"} Icon={CheckCircle2} tone="green" />
        <MetricCard label="OpEx Records" value={filteredOpex} hint={spendByClass.total ? `${pct((spendByClass.opexSpend / spendByClass.total) * 100)} of spend` : "No spend data"} Icon={Archive} />
        <MetricCard label="Pending Review" value={filteredReview} hint="Awaiting domain lead decision" Icon={AlertTriangle} tone="amber" />
        <MetricCard label="Avg Confidence" value={avgConf ? `${avgConf}%` : "N/A"} hint={`Routing threshold: ${REVIEW_THRESHOLD}%`} Icon={SearchCheck} />
        <MetricCard label="CapEx Spend" value={currency(spendByClass.capexSpend)} hint="Actual spend on CapEx-classified records" Icon={BarChart3} tone="green" />
        <MetricCard label="Override Rate" value={pct(filtered.length ? (filtered.filter(r => r._override).length / filtered.length) * 100 : 0)} hint="Manual corrections by reviewers" Icon={RefreshCw} tone="amber" />
      </section>

      <section className="split-grid">
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <PanelTitle title="Quarterly CapEx vs OpEx" copy="Record counts per fiscal quarter." Icon={BarChart3} />
            {seriesLegend}
          </div>
          <GroupedBarChart
            data={quarterlyData.map(d => ({ label: d.q, values: [d.capex, d.opex, d.review] }))}
            series={[{ label: "CapEx", color: AC.capex }, { label: "OpEx", color: AC.opex }, { label: "Review", color: AC.review }]}
          />
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            {quarterlyData.filter(d => d.total > 0).map(d => (
              <span key={d.q} style={{ fontSize: 11, color: AC.lbl }}>
                <strong style={{ color: "var(--text)" }}>{d.q}</strong> · CapEx {d.total ? pct((d.capex / d.total) * 100) : "0%"} · {currency(d.capexSpend)}
              </span>
            ))}
          </div>
        </div>
        <div className="panel">
          <PanelTitle title="Monthly CapEx % Trend" copy="Share of records classified as CapEx per month. Stub shown when fewer than 3 months available." Icon={Activity} />
          <AreaLineChart data={monthlyTrend} color={AC.capex} unit="%" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: AC.lbl }}>
            <span>Avg {Math.round(monthlyTrend.reduce((s, d) => s + d.value, 0) / monthlyTrend.length)}%</span>
            <span>Peak {Math.max(...monthlyTrend.map(d => d.value))}% · {monthlyTrend.reduce((a, b) => a.value >= b.value ? a : b).label}</span>
          </div>
        </div>
      </section>

      <section className="split-grid">
        <div className="panel">
          <PanelTitle title="Spend by Classification" copy="Actual spend allocated across CapEx, OpEx, and pending review." Icon={Archive} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
            {[
              { label: "CapEx", value: spendByClass.capexSpend, color: AC.capex, count: filteredCapex },
              { label: "OpEx",  value: spendByClass.opexSpend,  color: AC.opex,  count: filteredOpex },
              { label: "Pending Review", value: spendByClass.reviewSpend, color: AC.review, count: filteredReview },
            ].map(({ label, value, color, count }) => {
              const share = spendByClass.total ? (value / spendByClass.total) * 100 : 0;
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{currency(value)}</span>
                  </div>
                  <div style={{ background: "#f0f2f5", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${share}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: AC.lbl }}>
                    <span>{count} records</span><span>{pct(share)} of total</span>
                  </div>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: AC.lbl }}>Total spend</span>
              <strong style={{ fontSize: 14 }}>{currency(spendByClass.total)}</strong>
            </div>
          </div>
        </div>
        <div className="panel">
          <PanelTitle title="Confidence Band Distribution" copy="Records bucketed by classifier score. Below 60 routes to review queue." Icon={SearchCheck} />
          <VerticalHistogram bands={confidenceBands} total={filtered.length} />
        </div>
      </section>

      <section className="split-grid">
        <div className="panel">
          <PanelTitle title="Labor Category — CapEx Volume" copy="CapEx record count per labor survey category." Icon={TableProperties} />
          {categoryData.length
            ? <LollipopChart data={categoryData.map(d => ({ label: d.label, value: d.capex, sub: `${d.capex} / ${d.total}` }))} color={AC.capex} />
            : <EmptyState copy="Upload data to see category breakdown." />}
        </div>
        <div className="panel">
          <PanelTitle title="Division CapEx Rate" copy="Percentage of records classified as CapEx per division, ranked highest first." Icon={Users} />
          {divisionData.length
            ? <LollipopChart
                data={divisionData
                  .map(d => ({ label: d.label, pct: d.total ? Math.round((d.capex / d.total) * 100) : 0 }))
                  .sort((a, b) => b.pct - a.pct)
                  .map(d => ({ label: d.label, value: d.pct, sub: `${d.pct}%` }))}
                color={AC.capex}
              />
            : <EmptyState copy="Upload data to see division breakdown." />}
        </div>
      </section>

      <section className="panel">
        <PanelTitle title="Regional Market Heatmap" copy="Each tile is a regional market. Darker green = more records. Bar shows CapEx share." Icon={Database} />
        {regionalData.length
          ? <RegionTiles data={regionalData} />
          : <EmptyState copy="Upload data to see regional breakdown." />}
      </section>
    </div>
  );
}

