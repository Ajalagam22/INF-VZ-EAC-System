from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class DataQuality(BaseModel):
    completenessScore: float = Field(default=1.0)
    missingFields: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class RowQuality(BaseModel):
    status: str = Field(default="clean")
    issues: List[str] = Field(default_factory=list)
    repairedFields: List[str] = Field(default_factory=list)
    quarantinedFields: List[str] = Field(default_factory=list)
    corrections: List[Dict[str, Any]] = Field(default_factory=list)


class NormalizedActivityRecord(BaseModel):
    InitiativeID: Optional[str] = None
    InitiativeName: Optional[str] = None
    DivisionCode: Optional[str] = None
    TechnologyGeneration: Optional[str] = None
    FiscalYear: Optional[str] = None
    FiscalMonth: Optional[str] = None
    FiscalQuarter: Optional[str] = None
    ProjectStartDate: Optional[str] = None
    ProjectEndDate: Optional[str] = None
    SiteCity: Optional[str] = None
    SiteState: Optional[str] = None
    SiteZipCode: Optional[str] = None
    SiteSwitchCode: Optional[str] = None
    RegionalSwitchCode: Optional[str] = None
    RegionalMarket: Optional[str] = None
    RegionalState: Optional[str] = None
    OperationsCluster: Optional[str] = None
    SpendType: Optional[str] = None
    VZZ_CostClass: Optional[str] = None
    VZZ_WorkType: Optional[str] = None
    LaborSurvey_Category: Optional[str] = None
    CapEx_Eligible_Pct: float = 0.0
    BudgetAmount_USD: float = 0.0
    ActualSpend_USD: float = 0.0
    ForecastSpend_USD: float = 0.0
    CumulativeSpend_USD: float = 0.0
    Variance_USD: float = 0.0
    Variance_Pct: float = 0.0
    PassingUnits: float = 0.0
    Asset_Life_Years: float = 0.0
    Depreciation_Annual_USD: float = 0.0
    Engineer_ID: Optional[str] = None
    Team: Optional[str] = None
    Hours_Logged: float = 0.0
    Activity_Type: Optional[str] = None
    Source_System: Optional[str] = None
    Miles_Driven: float = 0.0
    DriveTests_Completed: float = 0.0
    Pre_Post_Flag: Optional[str] = None
    Milestones_Completed: float = 0.0
    Project_Status: Optional[str] = None
    key: str = Field(default="", alias="_key")
    source: str = Field(default="", alias="_source")
    source_file_name: str = Field(default="", alias="_sourceFileName")
    source_record_id: Optional[str] = Field(default=None, alias="_sourceRecordId")
    rule_version: str = Field(default="", alias="_ruleVersion")
    persona: str = Field(default="", alias="_persona")
    normalized_at: str = Field(default="", alias="_normalizedAt")
    extraction_confidence: float = Field(default=0.0, alias="_extractionConfidence")
    raw_fields: Dict[str, Any] = Field(default_factory=dict, alias="_rawFields")
    normalized_fields: Dict[str, Any] = Field(default_factory=dict, alias="_normalizedFields")
    data_quality: DataQuality = Field(default_factory=DataQuality, alias="_dataQuality")
    row_quality: RowQuality = Field(default_factory=RowQuality, alias="_rowQuality")
    form_validation: Dict[str, Any] = Field(default_factory=dict, alias="_formValidation")
    matched_excel: int = Field(default=0, alias="_matchedExcel")

    model_config = ConfigDict(
        extra="allow",
        populate_by_name=True,
        validate_by_name=True,
    )
