from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

from src.models import Signal, Opportunity, Account, AccountView, SignalSourceType


class EvidenceRefSchema(BaseModel):
    """Evidence reference schema"""
    model_config = ConfigDict(from_attributes=True)
    
    signal_id: Optional[str] = None
    doc_id: Optional[str] = None
    chunk_id: Optional[str] = None
    source_type: Optional[str] = None
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
    workflow_status: str = Field(default="pending")
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
    status: str = "pending"
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
