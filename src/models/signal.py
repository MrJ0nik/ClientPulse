from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


class SignalSourceType(str, Enum):
    """Signal source type enum"""
    NEWS = "news"
    SEC_FILING_10K = "sec_filing_10k"
    PRESS_RELEASE = "press_release"
    JOB_POSTING = "job_posting"
    EARNINGS_CALL = "earnings_call"
    SOCIAL_MEDIA = "social_media"
    INSIDER_TRADE = "insider_trade"
    PATENT_FILING = "patent_filing"
    M_A = "m_a"
    INTERNAL_CRM = "internal_crm"
    INTERNAL_PROJECT = "internal_project"
    TRANSCRIPT = "transcript"


class SignalPriority(str, Enum):
    """Signal priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EvidenceRef(BaseModel):
    """Reference to evidence supporting a signal with source metadata"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    signal_id: Optional[str] = None
    doc_id: Optional[str] = None
    chunk_id: Optional[str] = None  # Deprecated: kept for backwards compatibility
    
    # Source metadata
    title: Optional[str] = None
    domain: Optional[str] = None
    url: Optional[str] = None
    source_type: Optional[str] = None  # article, pdf, site, news, research, filing, etc.
    
    # Content preview
    excerpt: Optional[str] = None
    snippet: Optional[str] = None
    relevance_score: Optional[float] = None


class Signal(BaseModel):
    """Signal model representing a business opportunity indicator"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    account_id: str
    tenant_id: str
    title: str
    description: Optional[str] = None
    source_type: SignalSourceType = Field(default=SignalSourceType.NEWS)
    priority: SignalPriority = Field(default=SignalPriority.MEDIUM)
    source_url: Optional[str] = None
    ingestion_date: datetime = Field(default_factory=datetime.utcnow)
    entities: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    evidence_refs: List[EvidenceRef] = Field(default_factory=list)
    workflow_status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @field_validator("source_type", mode="before")
    @classmethod
    def normalize_source_type(cls, v):
        """Normalize source_type to lowercase for enum matching"""
        if isinstance(v, str):
            return v.lower()
        return v


class SignalCreate(BaseModel):
    """Schema for creating a new signal"""
    account_id: str
    tenant_id: str
    title: str
    description: Optional[str] = None
    source_type: SignalSourceType = Field(default=SignalSourceType.NEWS)
    priority: SignalPriority = Field(default=SignalPriority.MEDIUM)
    source_url: Optional[str] = None
    entities: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    
    @field_validator("source_type", mode="before")
    @classmethod
    def normalize_source_type(cls, v):
        """Normalize source_type to lowercase for enum matching"""
        if isinstance(v, str):
            return v.lower()
        return v
