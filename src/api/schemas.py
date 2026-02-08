from datetime import datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

from src.models import Signal, Opportunity, Account, AccountView, SignalSourceType


# ==================== Status Enums ====================
class OpportunityStatus(str, Enum):
    """Standardized opportunity workflow statuses (lowercase)"""
    DRAFT = "draft"  # Initial state, newly generated
    PENDING_REVIEW = "pending_review"  # Ready for AM review
    APPROVED = "approved"  # AM approved, ready for CRM activation
    REJECTED = "rejected"  # AM rejected
    NEEDS_MORE_EVIDENCE = "needs_more_evidence"  # AM requested more evidence
    ACTIVATION_REQUESTED = "activation_requested"  # Sent to CRM
    ACTIVATED = "activated"  # Successfully activated in CRM
    ACTIVATION_FAILED = "activation_failed"  # CRM activation failed
    ACTIVATION_PARTIAL = "activation_partial"  # Partial CRM activation


class SignalWorkflowStatus(str, Enum):
    """Signal workflow status"""
    PENDING = "pending"
    INGESTED = "ingested"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class EvidenceRefSchema(BaseModel):
    """Evidence reference schema with source metadata"""
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


class SignalSchema(BaseModel):
    """Signal request/response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    account_id: str
    tenant_id: str
    title: str
    description: Optional[str] = None
    source_type: SignalSourceType = Field(default=SignalSourceType.NEWS)
    priority: Optional[str] = "medium"
    source_url: Optional[str] = None
    entities: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    evidence_refs: List[EvidenceRefSchema] = Field(default_factory=list)
    workflow_status: SignalWorkflowStatus = SignalWorkflowStatus.PENDING
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class OpportunitySchema(BaseModel):
    """Opportunity request/response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = None
    account_id: str
    tenant_id: str
    account_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: OpportunityStatus = OpportunityStatus.DRAFT
    opportunity_type: str = "new_business"
    estimated_value: Optional[float] = None
    currency: Optional[str] = "USD"
    probability: Optional[float] = 0.5
    signal_ids: List[str] = Field(default_factory=list)
    source_signals: List[dict] = Field(default_factory=list)
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    next_steps: List[str] = Field(default_factory=list)
    assigned_to: Optional[str] = None
    crm_status: Optional[str] = None
    crm_activated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AccountSchema(BaseModel):
    """Account request/response schema"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    annual_revenue: Optional[float] = None
    employee_count: Optional[int] = None
    owner_am_id: Optional[str] = None
    owner_am_name: Optional[str] = None
    status: Optional[str] = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AccountViewSchema(BaseModel):
    """Account view schema for dashboards"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    tenant_id: str
    name: str
    industry: Optional[str] = None
    signals_count: int = 0
    opportunities_count: int = 0
    pending_signals: int = 0
    pending_opportunities: int = 0
    high_priority_signals: int = 0
    pipeline_value: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
